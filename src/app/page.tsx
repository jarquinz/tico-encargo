'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Client, Transaction } from '@/lib/supabase'
import { 
  Plus, 
  Users, 
  ArrowLeft,
  Search,
  CreditCard,
  Wallet,
  Calendar,
  X,
  Trash2
} from 'lucide-react'

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'newClient' | 'clientsList' | 'clientDetail'>('dashboard')
  const [currentClient, setCurrentClient] = useState<Client | null>(null)
  const [filter, setFilter] = useState<'all' | 'week' | 'month' | 'custom'>('all')
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (clientsError) {
        console.error('Error loading clients:', clientsError)
        setClients([])
      } else {
        setClients((clientsData as unknown as Client[]) || [])
      }

      // Cargar transacciones
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })

      if (transactionsError) {
        console.error('Error loading transactions:', transactionsError)
        setTransactions([])
      } else {
        setTransactions((transactionsData as unknown as Transaction[]) || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setClients([])
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  // Calcular estadísticas
  const totalDebt = clients.reduce((sum, client) => sum + client.current_debt, 0)


  const filteredIncome = transactions
    .filter(t => {
      if (t.type !== 'payment') return false
      
      const transactionDate = new Date(t.date)
      const now = new Date()
      
      if (filter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return transactionDate >= weekAgo
      } else if (filter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return transactionDate >= monthAgo
      } else if (filter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        const startDate = new Date(customDateRange.startDate)
        const endDate = new Date(customDateRange.endDate)
        return transactionDate >= startDate && transactionDate <= endDate
      }
      
      return true
    })
    .reduce((sum, t) => sum + t.amount, 0)

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Agregar nuevo cliente
  const addClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()

      if (error) {
        console.error('Error adding client:', error)
        alert('Error al agregar cliente. Verifica la conexión a la base de datos.')
        return
      }

      setClients(prev => [(data[0] as unknown as Client), ...prev])
      setCurrentScreen('dashboard')
      alert('✅ Cliente agregado exitosamente')
    } catch (error) {
      console.error('Error adding client:', error)
      alert('Error al agregar cliente. Verifica la conexión a la base de datos.')
    }
  }

  // Agregar transacción
  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()

      if (error) {
        console.error('Error adding transaction:', error)
        alert('Error al agregar transacción. Verifica la conexión a la base de datos.')
        return
      }

      // Actualizar deuda del cliente
      const client = clients.find(c => c.id === transactionData.client_id)
      if (client) {
        const newDebt = transactionData.type === 'payment' 
          ? Math.max(0, client.current_debt - transactionData.amount)
          : client.current_debt + transactionData.amount

        const { error: updateError } = await supabase
          .from('clients')
          .update({ current_debt: newDebt })
          .eq('id', client.id)

        if (updateError) {
          console.error('Error updating client debt:', updateError)
        } else {
          setClients(prev => prev.map((c: Client) => 
            c.id === client.id ? { ...c, current_debt: newDebt } : c
          ))
        }
      }

      setTransactions(prev => [(data[0] as unknown as Transaction), ...prev])
      alert('✅ Transacción agregada exitosamente')
    } catch (error) {
      console.error('Error adding transaction:', error)
      alert('Error al agregar transacción. Verifica la conexión a la base de datos.')
    }
  }

  const deleteClient = async (clientId: number) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) {
        console.error('Error deleting client:', error)
        alert('Error al eliminar cliente. Verifica la conexión a la base de datos.')
        return
      }

      // Remover cliente de la lista local
      setClients(prev => prev.filter(c => c.id !== clientId))
      
      // Si el cliente actual es el que se está borrando, volver a la lista
      if (currentClient && currentClient.id === clientId) {
        setCurrentScreen('clientsList')
        setCurrentClient(null)
      }

      alert('✅ Cliente eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Error al eliminar cliente. Verifica la conexión a la base de datos.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {currentScreen === 'dashboard' && (
        <DashboardView 
          totalDebt={totalDebt}
          filteredIncome={filteredIncome}
          filter={filter}
          setFilter={setFilter}
          customDateRange={customDateRange}
          setCustomDateRange={setCustomDateRange}
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
          setCurrentScreen={setCurrentScreen}
          clients={clients}
          transactions={transactions}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}

      {currentScreen === 'newClient' && (
        <NewClientView 
          onBack={() => setCurrentScreen('dashboard')}
          onAddClient={addClient}
        />
      )}

      {currentScreen === 'clientsList' && (
        <ClientsListView 
          clients={clients}
          transactions={transactions}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onBack={() => setCurrentScreen('dashboard')}
          onClientClick={(client: Client) => {
            setCurrentClient(client)
            setCurrentScreen('clientDetail')
          }}
          formatCurrency={formatCurrency}
        />
      )}

      {currentScreen === 'clientDetail' && currentClient && (
        <ClientDetailView 
          client={currentClient}
          transactions={transactions.filter(t => t.client_id === currentClient.id)}
          onBack={() => setCurrentScreen('clientsList')}
          onAddTransaction={addTransaction}
          onDeleteClient={deleteClient}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}
    </div>
  )
}

// Componente Dashboard
function DashboardView({ 
  totalDebt, 
  filteredIncome, 
  filter, 
  setFilter, 
  customDateRange, 
  setCustomDateRange, 
  showDatePicker, 
  setShowDatePicker, 
  setCurrentScreen, 
  clients, 
  transactions, 
  formatCurrency, 
  formatDate 
}: {
  totalDebt: number
  filteredIncome: number
  filter: 'all' | 'week' | 'month' | 'custom'
  setFilter: (filter: 'all' | 'week' | 'month' | 'custom') => void
  customDateRange: { startDate: string; endDate: string }
  setCustomDateRange: React.Dispatch<React.SetStateAction<{ startDate: string; endDate: string }>>
  showDatePicker: boolean
  setShowDatePicker: (show: boolean) => void
  setCurrentScreen: (screen: 'dashboard' | 'newClient' | 'clientsList' | 'clientDetail') => void
  clients: Client[]
  transactions: Transaction[]
  formatCurrency: (amount: number) => string
  formatDate: (dateString: string) => string
}) {
  const recentTransactions = transactions.slice(0, 5)

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">🏪 Tico Encargo</h1>
        <p className="text-gray-600">Cartera de Clientes</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 text-center">
            <h3 className="text-sm text-gray-600 mb-2">💰 Total Adeudado</h3>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 text-center">
            <h3 className="text-sm text-gray-600 mb-2">📈 Ingresos</h3>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(filteredIncome)}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'Todo' },
            { key: 'week', label: '7 días' },
            { key: 'month', label: '30 días' },
            { key: 'custom', label: 'Personalizado' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setFilter(key as 'all' | 'week' | 'month' | 'custom')
                if (key === 'custom') {
                  setShowDatePicker(true)
                } else {
                  setShowDatePicker(false)
                }
              }}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                filter === key 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Selector de fechas personalizado */}
        {showDatePicker && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">📅 Seleccionar rango de fechas</h3>
              <button
                onClick={() => setShowDatePicker(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-600">Fecha inicial</label>
                <input
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) => setCustomDateRange((prev: { startDate: string; endDate: string }) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-600">Fecha final</label>
                <input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) => setCustomDateRange((prev: { startDate: string; endDate: string }) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            {customDateRange.startDate && customDateRange.endDate && (
              <div className="mt-3 text-sm text-gray-600">
                <Calendar size={16} className="inline mr-1" />
                Mostrando ingresos del {formatDate(customDateRange.startDate)} al {formatDate(customDateRange.endDate)}
              </div>
            )}
          </div>
        )}

        {/* Botones principales */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setCurrentScreen('newClient')}
            className="bg-blue-600 text-white p-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all hover:scale-105"
          >
            <Plus size={20} />
            Nuevo Cliente
          </button>
          <button
            onClick={() => setCurrentScreen('clientsList')}
            className="bg-red-600 text-white p-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-all hover:scale-105"
          >
            <Users size={20} />
            Ver Clientes
          </button>
        </div>

        {/* Actividad reciente */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">📊 Actividad Reciente</h3>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay actividad reciente</p>
              <p className="text-sm">Agrega tu primer cliente para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction: Transaction) => {
                const client = clients.find((c: Client) => c.id === transaction.client_id)
                return (
                  <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold">
                        {transaction.type === 'payment' ? '💳' : '💰'} {client?.name}
                      </h4>
                      <p className="text-sm text-gray-600">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                    </div>
                    <div className={`font-bold ${
                      transaction.type === 'payment' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'payment' ? '+' : ''}{formatCurrency(transaction.amount)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente Nuevo Cliente
function NewClientView({ onBack, onAddClient }: {
  onBack: () => void
  onAddClient: (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
}) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    current_debt: 0,
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddClient(formData)
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft size={20} />
        Volver
      </button>

      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
        <h2 className="text-2xl font-bold mb-6">👤 Nuevo Cliente</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Nombre del Cliente</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Teléfono</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Monto Adeudado Inicial</label>
            <input
              type="number"
              min="0"
              step="100"
              required
              value={formData.current_debt}
              onChange={(e) => setFormData(prev => ({ ...prev, current_debt: Number(e.target.value) }))}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Notas</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-4 rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            💾 Guardar Cliente
          </button>
        </form>
      </div>
    </div>
  )
}

// Componente Lista de Clientes
function ClientsListView({ 
  clients, 
  transactions, 
  searchTerm, 
  setSearchTerm, 
  onBack, 
  onClientClick, 
  formatCurrency 
}: {
  clients: Client[]
  transactions: Transaction[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  onBack: () => void
  onClientClick: (client: Client) => void
  formatCurrency: (amount: number) => string
}) {
  const filteredClients = clients.filter((client: Client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  )

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft size={20} />
        Volver
      </button>

      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
        <h2 className="text-2xl font-bold mb-6">📋 Mis Clientes</h2>
        
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="🔍 Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredClients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No se encontraron clientes</p>
            </div>
          ) : (
            filteredClients.map((client: Client) => {
              const totalPaid = transactions
                .filter((t: Transaction) => t.client_id === client.id && t.type === 'payment')
                .reduce((sum: number, t: Transaction) => sum + t.amount, 0)

              return (
                <div
                  key={client.id}
                  onClick={() => onClientClick(client)}
                  className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-all border border-gray-200"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{client.name}</h3>
                      <p className="text-sm text-gray-600">{client.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600 font-semibold">
                        Abonado: {formatCurrency(totalPaid)}
                      </p>
                      <p className="text-sm text-red-600 font-semibold">
                        Adeudado: {formatCurrency(client.current_debt)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// Componente Detalle de Cliente
function ClientDetailView({ 
  client, 
  transactions, 
  onBack, 
  onAddTransaction, 
  onDeleteClient, 
  formatCurrency, 
  formatDate 
}: {
  client: Client
  transactions: Transaction[]
  onBack: () => void
  onAddTransaction: (transactionData: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>
  onDeleteClient: (clientId: number) => Promise<void>
  formatCurrency: (amount: number) => string
  formatDate: (dateString: string) => string
}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDebtModal, setShowDebtModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [transactionForm, setTransactionForm] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  })



  const handleTransaction = (type: 'payment' | 'debt') => {
    onAddTransaction({
      client_id: client.id,
      type,
      amount: transactionForm.amount,
      date: transactionForm.date,
      description: transactionForm.description || (type === 'payment' ? 'Abono' : 'Nueva deuda')
    })
    
    setTransactionForm({
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: ''
    })
    
    setShowPaymentModal(false)
    setShowDebtModal(false)
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft size={20} />
        Volver
      </button>

      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
        <h2 className="text-2xl font-bold mb-6">👤 {client.name}</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 text-center">
            <h3 className="text-sm text-gray-600 mb-2">💰 Deuda Actual</h3>
            <div className="text-xl font-bold text-red-600">{formatCurrency(client.current_debt)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 text-center">
            <h3 className="text-sm text-gray-600 mb-2">📞 Teléfono</h3>
            <div className="text-lg font-semibold">{client.phone || 'N/A'}</div>
          </div>
        </div>

        {client.notes && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm"><strong>📝 Notas:</strong> {client.notes}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="bg-blue-600 text-white p-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
          >
            <CreditCard size={20} />
            Abono
          </button>
          <button
            onClick={() => setShowDebtModal(true)}
            className="bg-red-600 text-white p-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-all"
          >
            <Wallet size={20} />
            Nueva Deuda
          </button>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">📊 Historial</h3>
          {transactions.length === 0 ? (
            <p className="text-gray-500">Sin historial de transacciones</p>
          ) : (
            <div className="space-y-3">
              {transactions
                .sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((transaction: Transaction) => (
                  <div
                    key={transaction.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      transaction.type === 'payment' 
                        ? 'bg-green-50 border-green-500' 
                        : 'bg-red-50 border-red-500'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">{formatDate(transaction.date)}</p>
                        <p className="font-semibold">
                          {transaction.type === 'payment' ? '💳' : '💰'} {transaction.description}
                        </p>
                      </div>
                      <div className={`font-bold ${
                        transaction.type === 'payment' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'payment' ? '-' : '+'}{formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Botón de Borrar Cliente */}
        <div className="mt-8 pt-6 border-t-2 border-gray-200">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full bg-red-600 text-white p-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-all"
          >
            <Trash2 size={20} />
            🗑️ Borrar Cliente
          </button>
        </div>
      </div>

      {/* Modal de Abono */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">💳 Registrar Abono</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Monto del Abono</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Fecha</label>
                <input
                  type="date"
                  required
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Notas</label>
                <input
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleTransaction('payment')}
                  className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Deuda */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">💰 Agregar Deuda</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Monto Adicional</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Fecha</label>
                <input
                  type="date"
                  required
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Descripción</label>
                <input
                  type="text"
                  placeholder="¿Por qué concepto?"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDebtModal(false)}
                  className="flex-1 bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleTransaction('debt')}
                  className="flex-1 bg-red-600 text-white p-3 rounded-lg hover:bg-red-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Borrar Cliente */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-red-600">🗑️ Borrar Cliente</h3>
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                <p className="text-red-800 font-semibold mb-2">⚠️ ¿Estás seguro?</p>
                <p className="text-red-700 text-sm">
                  Esta acción eliminará permanentemente al cliente <strong>{client.name}</strong> 
                  y todas sus transacciones. Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDeleteClient(client.id)
                    setShowDeleteModal(false)
                  }}
                  className="flex-1 bg-red-600 text-white p-3 rounded-lg hover:bg-red-700"
                >
                  🗑️ Borrar Definitivamente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
