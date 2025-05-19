"use client"

import { useState, useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Users, ShoppingCart, CreditCard, Settings, HelpCircle, Bell, Search, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import StatCard from "@/components/admin/stat-card"
import RecentActivityCard from "@/components/admin/recent-activity-card.tsx"
import SalesChart from "@/components/admin/sales-chart"
import UsersTable from "@/components/admin/users-table"
import PaymentsTable from "@/components/admin/payments-table"
import { getDashboardStats, getSalesData, getRecentActivities, getAllUsers, getAllPayments } from "../../services/adminService"
import { Link } from "react-router-dom"

// Dynamically import 3D components with no SSR to avoid hydration issues
const ThreeDBackground = dynamic(() => import("@/components/three-d-background"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-zinc-900" />,
})

const LogoCube = dynamic(() => import("@/components/admin/logo-cube"), {
  ssr: false,
  loading: () => <div className="w-8 h-8 bg-violet-900 rounded-md" />,
})

const ProductShowcase = dynamic(() => import("@/components/admin/product-showcase"), {
  ssr: false,
  loading: () => <div className="w-full h-[300px] bg-zinc-900 rounded-md" />,
})

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  
  // Dashboard state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>({})
  const [salesPeriod, setSalesPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [salesData, setSalesData] = useState<any>({})
  const [activities, setActivities] = useState<any>({})
  
  // Users tab state
  const [users, setUsers] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  
  // Payments/Transactions tab state
  const [payments, setPayments] = useState<any[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentsError, setPaymentsError] = useState<string | null>(null)
  
  // Fetch dashboard data from backend
  useEffect(() => {
    if (activeTab !== "dashboard") return;
    
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const stats = await getDashboardStats();
        setDashboardData(stats);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [activeTab]);
  
  // Fetch users data when users tab is active
  useEffect(() => {
    if (activeTab !== "users") return;
    
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const data = await getAllUsers();
        setUsers(data.users || []);
        setUsersError(null);
      } catch (err: any) {
        console.error('Error fetching users data:', err);
        setUsersError(err.message || 'Failed to fetch users data');
      } finally {
        setUsersLoading(false);
      }
    };
    
    fetchUsers();
  }, [activeTab]);
  
  // Fetch payments data when transactions tab is active
  useEffect(() => {
    if (activeTab !== "transactions") return;
    
    const fetchPayments = async () => {
      setPaymentsLoading(true);
      try {
        const data = await getAllPayments();
        setPayments(data.payments || []);
        setPaymentsError(null);
      } catch (err: any) {
        console.error('Error fetching payments data:', err);
        setPaymentsError(err.message || 'Failed to fetch payments data');
      } finally {
        setPaymentsLoading(false);
      }
    };
    
    fetchPayments();
  }, [activeTab]);
  
  // Fetch sales data when period changes
  useEffect(() => {
    if (activeTab !== "dashboard") return;
    
    const fetchSalesData = async () => {
      try {
        const data = await getSalesData(salesPeriod);
        setSalesData(data);
      } catch (err) {
        console.error(`Error fetching ${salesPeriod} sales data:`, err);
      }
    };
    
    fetchSalesData();
  }, [salesPeriod, activeTab]);
  
  // Fetch activities data
  useEffect(() => {
    if (activeTab !== "dashboard") return;
    
    const fetchActivities = async () => {
      try {
        const data = await getRecentActivities();
        setActivities(data);
      } catch (err) {
        console.error('Error fetching activities:', err);
      }
    };
    
    fetchActivities();
  }, [activeTab]);
  
  // Handle period change
  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly') => {
    setSalesPeriod(period);
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:relative md:translate-x-0 bg-zinc-900 w-64 p-4 flex flex-col`}
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="relative w-8 h-8">
            <LogoCube />
          </div>
          <h1 className="text-xl font-bold">Evenza Admin</h1>
        </div>

        <nav className="space-y-1 flex-1">
          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3 ${activeTab === "dashboard" ? "text-violet-400" : "text-gray-400 hover:text-white"}`}
            onClick={() => handleTabChange("dashboard")}
          >
            <BarChart3 className="h-5 w-5" />
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3 ${activeTab === "users" ? "text-violet-400" : "text-gray-400 hover:text-white"}`}
            onClick={() => handleTabChange("users")}
          >
            <Users className="h-5 w-5" />
            Users
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3 ${activeTab === "products" ? "text-violet-400" : "text-gray-400 hover:text-white"}`}
            onClick={() => handleTabChange("products")}
          >
            <ShoppingCart className="h-5 w-5" />
            Products
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3 ${activeTab === "transactions" ? "text-violet-400" : "text-gray-400 hover:text-white"}`}
            onClick={() => handleTabChange("transactions")}
          >
            <CreditCard className="h-5 w-5" />
            Transactions
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3 ${activeTab === "settings" ? "text-violet-400" : "text-gray-400 hover:text-white"}`}
            onClick={() => handleTabChange("settings")}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Button>
        </nav>

        <div className="mt-auto">
          <Button variant="ghost" className="w-full justify-start gap-3 text-gray-400 hover:text-white">
            <HelpCircle className="h-5 w-5" />
            Help & Support
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search..."
                className="pl-8 bg-zinc-800 border-zinc-700 focus-visible:ring-violet-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-violet-500">
                {dashboardData?.notifications?.length || 0}
              </Badge>
            </Button>

            <Avatar>
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6 relative">
          {/* 3D Background */}
          <div className="absolute inset-0 z-0 opacity-20">
            <Suspense fallback={<div className="w-full h-full bg-zinc-900" />}>
              <ThreeDBackground />
            </Suspense>
          </div>

          <div className="relative z-10">
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <>
                <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>

                {/* Error message if API fails */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500 p-4 mb-6 rounded-md">
                    <p className="text-white">Error: {error}</p>
                    <p className="text-sm text-gray-300 mt-1">Using mock data instead</p>
                  </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard
                    title="Total Users"
                    value={loading ? "Loading..." : String(dashboardData?.totalUsers || "0")}
                    change="+12%"
                    icon={<Users className="h-5 w-5" />}
                    color="violet"
                  />
                  <StatCard
                    title="Revenue"
                    value={loading ? "Loading..." : `$${dashboardData?.totalRevenue || "0"}`}
                    change="+8%"
                    icon={<CreditCard className="h-5 w-5" />}
                    color="blue"
                  />
                  <StatCard
                    title="Orders"
                    value={loading ? "Loading..." : String(dashboardData?.totalBookings || "0")}
                    change="+23%"
                    icon={<ShoppingCart className="h-5 w-5" />}
                    color="emerald"
                  />
                  <StatCard
                    title="Conversion"
                    value="3.6%"
                    change="-2%"
                    icon={<BarChart3 className="h-5 w-5" />}
                    color="amber"
                    isNegative
                  />
                </div>

                {/* Charts and Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <Card className="col-span-1 lg:col-span-2 bg-zinc-900/80 border-zinc-800">
                    <div className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Sales Analytics</h2>
                      <Tabs defaultValue="weekly" onValueChange={(value) => handlePeriodChange(value as any)}>
                        <div className="flex justify-between items-center mb-4">
                          <TabsList className="bg-zinc-800">
                            <TabsTrigger value="daily">Daily</TabsTrigger>
                            <TabsTrigger value="weekly">Weekly</TabsTrigger>
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                          </TabsList>
                        </div>

                        <TabsContent value="daily" className="mt-0">
                          <SalesChart period="daily" data={salesData?.salesData} />
                        </TabsContent>
                        <TabsContent value="weekly" className="mt-0">
                          <SalesChart period="weekly" data={salesData?.salesData} />
                        </TabsContent>
                        <TabsContent value="monthly" className="mt-0">
                          <SalesChart period="monthly" data={salesData?.salesData} />
                        </TabsContent>
                      </Tabs>
                    </div>
                  </Card>

                  <Card className="bg-zinc-900/80 border-zinc-800">
                    <div className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                      <RecentActivityCard activities={dashboardData?.recentPayments || []} />
                    </div>
                  </Card>
                </div>

                {/* Product / Event Showcase */}
                <Card className="bg-zinc-900/80 border-zinc-800 mb-8">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Event Stats</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-zinc-800/60 p-4 rounded-md">
                        <h3 className="text-violet-400 font-semibold">Events</h3>
                        <p className="text-2xl mt-2">{dashboardData?.eventStats?.events || 0}</p>
                      </div>
                      <div className="bg-zinc-800/60 p-4 rounded-md">
                        <h3 className="text-blue-400 font-semibold">Concerts</h3>
                        <p className="text-2xl mt-2">{dashboardData?.eventStats?.concerts || 0}</p>
                      </div>
                      <div className="bg-zinc-800/60 p-4 rounded-md">
                        <h3 className="text-emerald-400 font-semibold">Movies</h3>
                        <p className="text-2xl mt-2">{dashboardData?.eventStats?.movies || 0}</p>
                      </div>
                      <div className="bg-zinc-800/60 p-4 rounded-md">
                        <h3 className="text-amber-400 font-semibold">Sports</h3>
                        <p className="text-2xl mt-2">{dashboardData?.eventStats?.sports || 0}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}
            
            {/* Users Tab */}
            {activeTab === "users" && (
              <>
                <h1 className="text-3xl font-bold mb-6">User Management</h1>
                
                {usersError && (
                  <div className="bg-red-500/20 border border-red-500 p-4 mb-6 rounded-md">
                    <p className="text-white">Error: {usersError}</p>
                  </div>
                )}
                
                <UsersTable users={users} loading={usersLoading} />
              </>
            )}
            
            {/* Transactions Tab */}
            {activeTab === "transactions" && (
              <>
                <h1 className="text-3xl font-bold mb-6">Payment Transactions</h1>
                
                {paymentsError && (
                  <div className="bg-red-500/20 border border-red-500 p-4 mb-6 rounded-md">
                    <p className="text-white">Error: {paymentsError}</p>
                  </div>
                )}
                
                <PaymentsTable payments={payments} loading={paymentsLoading} />
              </>
            )}
            
            {/* Products Tab */}
            {activeTab === "products" && (
              <div className="text-center py-20">
                <h1 className="text-3xl font-bold mb-6">Products Management</h1>
                <p className="text-gray-400">Products management features coming soon.</p>
              </div>
            )}
            
            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="text-center py-20">
                <h1 className="text-3xl font-bold mb-6">Application Settings</h1>
                <p className="text-gray-400">Settings features coming soon.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
