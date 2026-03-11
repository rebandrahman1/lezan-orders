import React, { useState, useEffect } from 'react';
import { Package, Search, PlusCircle, FileText, Printer, Save, CheckCircle, MapPin, Phone, User, Calendar, Loader, Trash2, Edit, AlertCircle, ArrowRight, X, Check, RotateCcw, Truck, Clock, Calculator, DollarSign, TrendingUp, TruckIcon, Image as ImageIcon, Lock, LogOut } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// دۆخی بنچینەیی فۆڕمی داواکاری بە دۆخی (لە ئامادەکردندایە = pending) بۆ هەر داواکارییەکی نوێ
const initialFormState = {
  invoiceNumber: '',
  customerName: '',
  phone: '',
  address: '',
  items: [{ name: '', price: '' }],
  deliveryFee: '',
  details: '',
  notes: '',
  status: 'pending'
};

// ڕێکخستنەکانی فایەربەیسەکەی خۆت
const firebaseConfig = {
  apiKey: "AIzaSyCayhW25cnJvFNFdULV_0vVp37JfVChZxE",
  authDomain: "lezan-orders.firebaseapp.com",
  projectId: "lezan-orders",
  storageBucket: "lezan-orders.firebasestorage.app",
  messagingSenderId: "202331350301",
  appId: "1:202331350301:web:2e28097334ae1f6e80edf4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const collectionName = 'orders';

// دروستکردنی نەخشی فلۆراڵی بۆ باکگراوندی پسوڵەکە بە ڕەنگی شین
const floralBg = "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e3a8a' fill-opacity='0.08'%3E%3Cpath d='M30 0v20c0 5.523-4.477 10-10 10H0v-5h20c2.761 0 5-2.239 5-5V0h5zm0 60V40c0-5.523 4.477-10 10-10h20v5H40c-2.761 0-5 2.239-5 5v20h-5zM0 30h20c5.523 0 10-4.477 10-10V0h5v20c0 8.284-6.716 15-15 15H0v-5zm60 0H40c-5.523 0-10 4.477-10 10v20h-5V40c0-8.284 6.716-15 15-15h20v5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";
const logoUrl = "https://i.ibb.co/21CJbdv0/f60f7987303f8d39ba0c07ab91e1fdb5.png";
const qrUrl = "https://i.ibb.co/jPTJ47xq/qr-code-5.png";

export default function App() {
  // دۆخی چوونەژوورەوە
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('lezan_auth') === 'true';
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  const [currentTab, setCurrentTab] = useState('new');
  const [reportTab, setReportTab] = useState('pending'); 
  
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [printData, setPrintData] = useState(null);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });
  
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, orderId: null });
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const calculateTotal = (items = [], deliveryFee = 0) => {
    const itemsTotal = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    return itemsTotal + (Number(deliveryFee) || 0);
  };

  const generateInvoiceNumber = () => {
    return 'LZN-' + Math.floor(100000 + Math.random() * 900000);
  };

  // کرداری چوونەژوورەوە
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginUsername === 'Lezan' && loginPassword === 'Reband250195') {
      setIsLoggedIn(true);
      localStorage.setItem('lezan_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە!');
    }
  };

  // کرداری چوونەدەرەوە
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('lezan_auth');
    setLoginUsername('');
    setLoginPassword('');
  };

  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }

    if (!document.getElementById('html2canvas-cdn')) {
      const script = document.createElement('script');
      script.id = 'html2canvas-cdn';
      script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
      document.head.appendChild(script);
    }
    
    let linkIcon = document.querySelector("link[rel~='icon']");
    if (!linkIcon) {
      linkIcon = document.createElement('link');
      linkIcon.rel = 'icon';
      document.head.appendChild(linkIcon);
    }
    linkIcon.href = logoUrl;

    let linkApple = document.querySelector("link[rel='apple-touch-icon']");
    if (!linkApple) {
      linkApple = document.createElement('link');
      linkApple.rel = 'apple-touch-icon';
      document.head.appendChild(linkApple);
    }
    linkApple.href = logoUrl;

    let metaViewport = document.querySelector("meta[name='viewport']");
    if (!metaViewport) {
      metaViewport = document.createElement('meta');
      metaViewport.name = 'viewport';
      document.head.appendChild(metaViewport);
    }
    metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    
    let metaAppCapable = document.querySelector("meta[name='apple-mobile-web-app-capable']");
    if (!metaAppCapable) {
      metaAppCapable = document.createElement('meta');
      metaAppCapable.name = 'apple-mobile-web-app-capable';
      metaAppCapable.content = 'yes';
      document.head.appendChild(metaAppCapable);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error('هەڵە لە چوونەژوورەوەی فایەربەیس:', err);
        setAuthError('کێشە لە پەیوەندیکردن بە داتابەیس: ' + err.message);
        setAuthLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      if (usr) setUser(usr);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isLoggedIn) return;
    setLoadingOrders(true);
    
    const ordersRef = collection(db, collectionName);
    
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      fetchedOrders.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(fetchedOrders);
      setLoadingOrders(false);
    }, (error) => {
      console.error("هەڵە لە هێنانی داواکارییەکان:", error);
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [user, isLoggedIn]);

  useEffect(() => {
    if (currentTab === 'new' && !editingId && !formData.invoiceNumber) {
      setFormData(prev => ({ ...prev, invoiceNumber: generateInvoiceNumber() }));
    }
  }, [currentTab, editingId]);

  const handleAddItem = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { name: '', price: '' }] }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: '' }), 4000);
  };

  const handleSave = async (goToPrint = false) => {
    const hasValidItems = formData.items && formData.items.some(item => item.name.trim() !== '');
    if (!formData.customerName || (!formData.details && !hasValidItems)) {
      showToast('تکایە ناوی کڕیار و کاڵاکان پڕبکەرەوە', 'error');
      return;
    }

    if (!user) {
      showToast('سەرەتا کێشەی فایەربەیس چارەسەر بکە', 'error');
      return;
    }

    try {
      const orderData = {
        ...formData,
        updatedAt: Date.now(),
        userId: user.uid,
        status: formData.status || 'pending'
      };
      
      let savedOrder = { ...orderData };

      if (editingId) {
        const docRef = doc(db, collectionName, editingId);
        await updateDoc(docRef, orderData);
        showToast('داواکارییەکە بە سەرکەوتوویی نوێکرایەوە');
        savedOrder.id = editingId;
      } else {
        orderData.createdAt = Date.now();
        const docRef = await addDoc(collection(db, collectionName), orderData);
        showToast('داواکارییەکە بە سەرکەوتوویی تۆمارکرا');
        savedOrder.id = docRef.id;
        savedOrder.createdAt = orderData.createdAt;
      }
      
      if (goToPrint) {
        setPrintData(savedOrder);
        setCurrentTab('print');
      } else {
        setFormData({
          ...initialFormState,
          invoiceNumber: generateInvoiceNumber()
        });
        setEditingId(null);
        setCurrentTab('reports');
        setReportTab(orderData.status); 
      }
      
    } catch (error) {
      console.error("هەڵە لە پاشەکەوتکردن:", error);
      showToast('هەڵەیەک ڕوویدا: ' + error.message, 'error');
    }
  };

  const handleEdit = (order) => {
    setFormData({
      invoiceNumber: order.invoiceNumber || '',
      customerName: order.customerName || '',
      phone: order.phone || '',
      address: order.address || '',
      items: order.items && order.items.length > 0 ? order.items : [{ name: '', price: '' }],
      deliveryFee: order.deliveryFee || '',
      details: order.details || '',
      notes: order.notes || '',
      status: order.status || 'pending'
    });
    setEditingId(order.id);
    setCurrentTab('new');
  };

  const handlePrintExisting = (order) => {
    setPrintData(order);
    setCurrentTab('print');
  };

  const handleActualPrint = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      const printElement = document.getElementById('printable-receipt');
      if (printElement) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html dir="rtl">
              <head>
                <title>پسوڵەی داواکاری - ${printData?.invoiceNumber || ''}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  * { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                  body { background: white !important; margin: 0; padding: 15px; display: flex; justify-content: center; }
                  .shadow-2xl, .shadow-sm { box-shadow: none !important; }
                  @page { margin: 5mm; size: auto; }
                </style>
              </head>
              <body>
                ${printElement.outerHTML}
                <script>
                  setTimeout(() => {
                    window.print();
                  }, 800);
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        } else {
          window.print();
        }
      }
    } else {
      setTimeout(() => {
        window.print();
      }, 200);
    }
  };

  const handleSaveAsImage = async () => {
    const printElement = document.getElementById('printable-receipt');
    if (!printElement || typeof window.html2canvas === 'undefined') {
      showToast('تکایە کەمێک چاوەڕێ بکە تا سیستەم ئامادە دەبێت', 'error');
      return;
    }

    setIsGeneratingImage(true);
    showToast('خەریکی دروستکردنی وێنەکەیە...', 'success');

    try {
      printElement.classList.remove('shadow-2xl');
      
      const canvas = await window.html2canvas(printElement, {
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false
      });

      printElement.classList.add('shadow-2xl');

      const safeCustomerName = (printData?.customerName || 'کڕیار').replace(/[\/\\?%*:|"<>]/g, '-'); 
      const invoiceNumberStr = printData?.invoiceNumber || 'پسوڵە';
      const safeDate = new Date(printData?.createdAt || Date.now()).toISOString().split('T')[0]; 
      const fileName = `${invoiceNumberStr}_${safeCustomerName}_${safeDate}.png`;

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = image;
      link.click();
      
      setIsGeneratingImage(false);
      showToast('وێنەکە بە سەرکەوتوویی دابەزی', 'success');
    } catch (error) {
      console.error('هەڵە لە دروستکردنی وێنە:', error);
      setIsGeneratingImage(false);
      showToast('هەڵەیەک ڕوویدا لە دروستکردنی وێنەکەدا', 'error');
      printElement.classList.add('shadow-2xl'); 
    }
  };

  const confirmDelete = async () => {
    if (!user || !deleteModal.orderId) return;
    
    try {
      await deleteDoc(doc(db, collectionName, deleteModal.orderId));
      showToast('داواکارییەکە بە سەرکەوتوویی سڕایەوە', 'success');
    } catch (error) {
      console.error("هەڵە لە سڕینەوە:", error);
      showToast('هەڵەیەک ڕوویدا: ' + error.message, 'error');
    } finally {
      setDeleteModal({ isOpen: false, orderId: null });
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, collectionName, orderId), { status: newStatus });
      const statusText = 
        newStatus === 'completed' ? 'تەواوبوو' : 
        newStatus === 'returned' ? 'گەڕاوە' : 
        newStatus === 'on_way' ? 'لە ڕێگایە' : 'لە ئامادەکردندایە';
      showToast(`داواکارییەکە گوازرایەوە بۆ بەشی (${statusText})`);
    } catch (error) {
      console.error("هەڵە لە گۆڕینی دۆخ:", error);
      showToast('هەڵەیەک لە گۆڕینی دۆخەکەدا ڕوویدا', 'error');
    }
  };

  const filteredOrders = orders.filter(order => {
    const orderStatus = order.status === 'active' ? 'pending' : (order.status || 'pending'); 
    
    const matchesSearch = (order.invoiceNumber && order.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (order.phone && order.phone.includes(searchQuery));
    
    return matchesSearch && orderStatus === reportTab;
  });

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('ku-IQ') + ' - ' + d.toLocaleTimeString('ku-IQ', { hour: '2-digit', minute:'2-digit' });
  };

  const getAccountingStats = () => {
    const start = new Date(dateRange.startDate).getTime();
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999); 
    const endTime = end.getTime();

    const ordersInDateRange = orders.filter(order => {
      const orderDate = order.createdAt || 0;
      return orderDate >= start && orderDate <= endTime;
    });

    let stats = {
      totalRevenue: 0, 
      completedRevenue: 0, 
      returnedRevenue: 0, 
      totalDeliveryFees: 0, 
      netProfit: 0 
    };

    ordersInDateRange.forEach(order => {
      const orderTotal = calculateTotal(order.items, order.deliveryFee);
      const deliveryFee = Number(order.deliveryFee) || 0;
      
      stats.totalRevenue += orderTotal;

      if (order.status === 'completed') {
        stats.completedRevenue += orderTotal;
        stats.totalDeliveryFees += deliveryFee;
      } else if (order.status === 'returned') {
        stats.returnedRevenue += orderTotal;
      }
    });

    stats.netProfit = stats.completedRevenue - stats.totalDeliveryFees;

    return { stats, orderCount: ordersInDateRange.length };
  };

  const accountingData = getAccountingStats();

  // پیشاندانی پەنجەرەی چوونەژوورەوە ئەگەر یوزەر نەچووبێتە ژوورەوە
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 relative overflow-hidden font-[Calibri]" dir="rtl">
        {/* Background decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 border border-white/50">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-stone-100">
              <img src={logoUrl} alt="Logo" className="h-20 md:h-24 object-contain" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-center text-blue-950 mb-2">سیستەمی لێزان دیزاین</h1>
          <p className="text-center text-stone-500 mb-8 text-sm font-medium">تکایە زانیارییەکانت بنوسە بۆ چوونەژوورەوە</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center border border-red-100 flex items-center justify-center gap-2">
                <AlertCircle size={18} />
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">ناوی بەکارهێنەر</label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"><User size={18} /></div>
                <input 
                  type="text" 
                  value={loginUsername} 
                  onChange={(e) => setLoginUsername(e.target.value)} 
                  className="w-full p-3.5 pr-12 rounded-xl border border-stone-200 focus:ring-2 focus:ring-blue-500 outline-none transition bg-stone-50 focus:bg-white font-mono text-lg" 
                  placeholder="Username" 
                  dir="ltr" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">وشەی نهێنی</label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"><Lock size={18} /></div>
                <input 
                  type="password" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
                  className="w-full p-3.5 pr-12 rounded-xl border border-stone-200 focus:ring-2 focus:ring-blue-500 outline-none transition bg-stone-50 focus:bg-white font-mono text-lg tracking-widest" 
                  placeholder="••••••••" 
                  dir="ltr" 
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition transform hover:-translate-y-0.5 mt-4 text-lg"
            >
              چوونەژوورەوە
            </button>
          </form>
          <div className="mt-8 text-center text-xs text-stone-400">
            گەشەپێدراوە بۆ پاراستنی زانیارییەکانت
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-100 text-blue-700"><Loader className="animate-spin" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col selection:bg-blue-200 print:bg-white" dir="rtl">
      
      {authError && (
        <div className="no-print bg-red-100 border-b border-red-200 text-red-800 p-3 text-center text-sm font-bold flex items-center justify-center gap-2 z-50">
          <AlertCircle size={20} />
          {authError}
        </div>
      )}

      {/* --- شێوازی تایبەت بە چاپکردن بە شێوەیەکی زۆر ورد (Advanced Print Styles) --- */}
      <style>{`
        * {
          font-family: 'Calibri', 'Segoe UI', Arial, sans-serif !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        @media print {
          body, html {
            background-color: white !important;
            height: 100% !important;
            min-height: 100% !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .no-print { display: none !important; }
          
          .print-wrapper-fix {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            overflow: visible !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            background: transparent !important;
          }
          
          .print-section {
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            display: block !important;
            page-break-inside: avoid !important;
          }
          
          .shadow-2xl, .shadow-sm, .shadow-md, .shadow-lg { 
             box-shadow: none !important; 
          }
          
          @page { 
            margin: 5mm; 
            size: auto; 
          }
        }
        
        /* شاردنەوەی سکڕۆڵ بۆ مۆبایل */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* --- پەنجەرەی دڵنیابوونەوەی سڕینەوە --- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl transform scale-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex justify-center items-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-center text-stone-900 mb-2">سڕینەوەی پسوڵە!</h3>
            <p className="text-center text-stone-500 mb-8 leading-relaxed text-sm md:text-base">
              ئایا دڵنیایت لە سڕینەوەی ئەم پسوڵەیە؟ ئەم کردارە پاشگەزبوونەوەی تێدا نییە.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setDeleteModal({ isOpen: false, orderId: null })}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-stone-200 text-stone-600 font-bold hover:bg-stone-50 transition"
                title="پاشگەزبوونەوە لە سڕینەوە"
              >
                نەخێر، گەڕانەوە
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-600/30 transition transform hover:-translate-y-0.5"
                title="دڵنیابوون لە سڕینەوە"
              >
                بەڵێ، بیسڕەوە
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- پەنجەرەی چاپکردن و وێنەگرتن --- */}
      {currentTab === 'print' && printData && (
        <div className="absolute inset-0 z-40 bg-stone-200/90 backdrop-blur-md overflow-y-auto flex flex-col print-wrapper-fix">
          <div className="no-print sticky top-0 bg-white shadow-md border-b border-stone-300 p-3 md:p-4 flex justify-between items-center px-4 md:px-8 z-50 w-full shrink-0">
            <div className="flex items-center gap-2 md:gap-4">
               <button 
                 onClick={() => {
                    setCurrentTab(editingId ? 'new' : 'reports');
                    setPrintData(null);
                 }} 
                 className="px-3 md:px-5 py-2.5 rounded-xl border-2 border-stone-300 text-stone-700 font-bold hover:bg-stone-50 hover:text-blue-700 transition flex items-center gap-1.5 md:gap-2 text-xs md:text-base"
                 title="گەڕانەوە بۆ لیستی داواکارییەکان"
               >
                 <ArrowRight size={18} />
                 گەڕانەوە
               </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSaveAsImage}
                disabled={isGeneratingImage}
                className={`px-3 md:px-6 py-2.5 md:py-3 rounded-xl border-2 border-blue-600 text-blue-700 font-bold text-xs md:text-base hover:bg-blue-50 transition flex items-center gap-1.5 md:gap-2 ${isGeneratingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="سەیڤکردنی پسوڵەکە وەک وێنە بۆ ناو مۆبایل یان کۆمپیوتەر"
              >
                {isGeneratingImage ? <Loader size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                سەیڤ وەک وێنە
              </button>

              <button 
                onClick={handleActualPrint} 
                className="px-4 md:px-8 py-2.5 md:py-3 rounded-xl bg-blue-600 text-white font-bold text-sm md:text-lg hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition flex items-center gap-2 md:gap-3 transform hover:scale-105"
                title="کردنەوەی پەنجەرەی پرینتەر بۆ چاپکردنی پسوڵەکە"
              >
                <Printer size={20} />
                چاپکردن
              </button>
            </div>
          </div>

          <div className="print-section flex-1 py-6 md:py-10 w-full flex justify-center bg-transparent">
            {/* id="printable-receipt" پێویستە بۆ ئەوەی وێنەی لێ بگیرێت */}
            <div id="printable-receipt" className="w-full max-w-[10.5cm] md:mx-auto bg-white relative shadow-2xl print:w-auto print:max-w-full print:mx-0 print:shadow-none print:break-inside-avoid">
              <div className="absolute inset-0 z-0 opacity-10 overflow-hidden rounded-lg pointer-events-none print:opacity-[0.15]">
                <div className="w-full h-full" style={{ backgroundImage: `url("${floralBg}")`, backgroundSize: '60px' }}></div>
              </div>

              <div className="border-[4px] border-double border-blue-900/90 p-1.5 min-h-full rounded-lg bg-transparent h-full relative z-10">
                <div className="border border-blue-800/30 min-h-full rounded p-4 md:p-5 relative overflow-visible bg-[#F8FAFC]/90 print:bg-[#F8FAFC] print:overflow-visible">
                  
                  <div className="absolute top-0 right-0 w-6 md:w-8 h-6 md:h-8 border-t-[3px] border-r-[3px] border-blue-900/70 rounded-tr-xl m-1"></div>
                  <div className="absolute top-0 left-0 w-6 md:w-8 h-6 md:h-8 border-t-[3px] border-l-[3px] border-blue-900/70 rounded-tl-xl m-1"></div>
                  <div className="absolute bottom-0 right-0 w-6 md:w-8 h-6 md:h-8 border-b-[3px] border-r-[3px] border-blue-900/70 rounded-br-xl m-1"></div>
                  <div className="absolute bottom-0 left-0 w-6 md:w-8 h-6 md:h-8 border-b-[3px] border-l-[3px] border-blue-900/70 rounded-bl-xl m-1"></div>

                  <div className="flex justify-center mb-3 relative z-20">
                    <div className="bg-white/95 p-2 rounded-2xl shadow-sm border border-blue-100 print:shadow-none">
                      <img src={logoUrl} crossOrigin="anonymous" alt="Lezan Design" className="h-16 md:h-20 object-contain print:h-24" />
                    </div>
                  </div>

                  <div className="text-center relative z-20 mb-5">
                    <h1 className="inline-block font-bold text-lg md:text-xl text-blue-950 border-b-2 border-blue-300 pb-1 print:text-2xl">پسوڵەی داواکاری</h1>
                  </div>

                  <div className="space-y-3 mb-6 relative z-20 bg-white/85 p-3 md:p-4 rounded-xl shadow-sm border border-blue-200/60 backdrop-blur-sm text-xs md:text-sm print:backdrop-blur-none print:shadow-none print:bg-white print:text-sm">
                    <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                        <span className="text-blue-800 font-semibold print:text-blue-900">ژمارەی پسوڵە:</span>
                        <span className="font-bold text-base md:text-lg text-stone-900 font-mono print:text-black" dir="ltr">{printData.invoiceNumber}</span>
                    </div>
                    <div className="flex flex-col gap-1 border-b border-blue-100 pb-2">
                        <span className="text-blue-800 font-semibold print:text-blue-900">ناوی کڕیار:</span>
                        <span className="font-bold text-sm md:text-base text-stone-900 print:text-black">{printData.customerName}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                        <span className="text-blue-800 font-semibold print:text-blue-900">مۆبایل:</span>
                        <span className="font-bold text-stone-900 print:text-black" dir="ltr">{printData.phone || '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1 border-b border-blue-100 pb-2">
                        <span className="text-blue-800 font-semibold print:text-blue-900">ناونیشان:</span>
                        <span className="font-medium text-stone-800 print:text-black">{printData.address || '-'}</span>
                    </div>
                    
                    {printData.items && printData.items.length > 0 && printData.items[0].name && (
                      <div className="mt-3 pb-3 border-b border-blue-100 print:break-inside-avoid">
                        <table className="w-full text-xs md:text-sm border-collapse">
                          <thead>
                            <tr className="text-blue-900 border-b border-blue-300 print:border-b-2">
                              <th className="py-1 text-right font-bold w-2/3 print:text-black">کاڵا</th>
                              <th className="py-1 text-left font-bold w-1/3 print:text-black">نرخ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {printData.items.map((item, i) => item.name && (
                              <tr key={i} className="border-b border-blue-50/80 print:border-stone-200">
                                <td className="py-1.5 text-stone-800 font-medium print:text-black">{item.name}</td>
                                <td className="py-1.5 text-left text-stone-900 font-mono font-bold print:text-black" dir="ltr">
                                  {(Number(item.price) || 0).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="flex justify-between items-center mt-2 pt-2 text-xs md:text-sm">
                            <span className="text-blue-800 font-semibold print:text-blue-900">نرخی گەیاندن:</span>
                            <span className="font-bold text-stone-900 font-mono print:text-black" dir="ltr">{(Number(printData.deliveryFee) || 0).toLocaleString()} IQD</span>
                        </div>
                        <div className="flex justify-between items-center mt-3 p-2 md:p-3 bg-blue-100/60 rounded-xl border border-blue-200 shadow-sm print:shadow-none print:bg-blue-50 print:border-blue-300">
                            <span className="text-blue-950 font-black text-base md:text-lg">کۆی گشتی:</span>
                            <span className="font-black text-lg md:text-2xl text-stone-950 font-mono print:text-black" dir="ltr">
                              {calculateTotal(printData.items, printData.deliveryFee).toLocaleString()} <span className="text-xs md:text-sm">IQD</span>
                            </span>
                        </div>
                      </div>
                    )}

                    {printData.details && (
                    <div className="flex flex-col gap-1 pb-1 pt-2 print:break-inside-avoid">
                        <span className="text-blue-800 font-semibold print:text-blue-900">وردەکاری زیاتر:</span>
                        <span className="font-medium text-stone-800 whitespace-pre-wrap leading-relaxed print:text-black">{printData.details}</span>
                    </div>
                    )}
                    
                    {printData.notes && (
                    <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-blue-100/50 bg-blue-50/50 p-2 rounded print:bg-stone-50 print:border-stone-200 print:break-inside-avoid">
                        <span className="text-blue-700/80 text-xs font-semibold print:text-blue-900">تێبینی:</span>
                        <span className="font-medium text-stone-700 italic text-[10px] md:text-xs print:text-black">{printData.notes}</span>
                    </div>
                    )}
                  </div>

                  <div className="mt-6 md:mt-8 text-center relative z-20 print:break-inside-avoid print:mt-10">
                    <p className="text-[10px] md:text-[11px] font-bold text-blue-950 leading-relaxed mb-4 px-2 md:px-3 bg-white/80 py-2.5 rounded-lg border border-blue-200 shadow-sm print:border-none print:bg-transparent print:shadow-none print:text-black print:text-xs">
                      سوپاس بۆ هەڵبژاردنی لێزان دیزاین،بە ڕەخنە و پێشنیارەکانتان سەربەرزمان دەکەن،تکایە فیدباکی خۆتانمان بۆ بنێرنەوە
                    </p>
                    <img src={qrUrl} crossOrigin="anonymous" alt="QR" className="h-16 w-16 md:h-20 md:w-20 mx-auto rounded-lg shadow-sm border-2 border-white print:border-none print:shadow-none print:h-24 print:w-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ڕووکاری سەرەکی سیستەم --- */}
      <div className={`no-print flex-1 flex flex-col md:flex-row w-full h-full overflow-hidden ${currentTab === 'print' ? 'hidden' : ''}`}>
        
        {/* شریتی لاکێشە (Sidebar) */}
        <div className="w-full md:w-64 bg-stone-900 text-stone-300 flex flex-col shadow-2xl z-10 shrink-0 border-b md:border-b-0 border-stone-800">
          <div className="p-4 md:p-6 bg-stone-950 border-b border-stone-800/50 flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 relative">
              <div className="flex items-center gap-3 md:flex-col">
                <div className="bg-white p-1.5 md:p-2 rounded-xl md:rounded-2xl flex justify-center w-12 md:w-full">
                   <img src={logoUrl} alt="Logo" className="h-10 md:h-16 object-contain" />
                </div>
                <h1 className="font-bold text-white text-sm md:text-base tracking-wide whitespace-nowrap">سیستەمی لێزان دیزاین</h1>
              </div>

              {/* دوگمەی چوونەدەرەوە بۆ مۆبایل */}
              <button 
                onClick={handleLogout}
                className="md:hidden p-2 text-stone-400 hover:text-white bg-stone-800 hover:bg-red-600 rounded-xl transition"
                title="چوونەدەرەوە لە سیستەم"
              >
                <LogOut size={18} />
              </button>
          </div>
          
          <div className="p-3 md:p-4 flex flex-row md:flex-col gap-2 md:gap-3 overflow-x-auto hide-scrollbar items-center">
              <button 
                onClick={() => {
                  setEditingId(null);
                  setFormData({...initialFormState, invoiceNumber: generateInvoiceNumber()});
                  setCurrentTab('new');
                }} 
                className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 px-3 md:px-4 py-2.5 md:py-3.5 rounded-xl transition-all duration-300 whitespace-nowrap ${currentTab === 'new' && !editingId ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/50 scale-100 md:scale-105' : 'bg-stone-800 md:bg-transparent hover:bg-stone-700 md:hover:bg-stone-800 hover:text-white'}`}
                title="تۆمارکردنی داواکارییەکی تازە"
              >
                  <PlusCircle size={20} />
                  <span className="text-sm md:text-base">داواکاری نوێ</span>
              </button>
              
              {editingId && currentTab === 'new' && (
                <div className="flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 px-3 md:px-4 py-2.5 md:py-3.5 rounded-xl bg-blue-600/20 text-blue-400 md:text-blue-50 font-bold border border-blue-600/30 whitespace-nowrap">
                  <Edit size={20} />
                  <span className="text-sm md:text-base">دەستکاریکردن</span>
                </div>
              )}

              <button 
                onClick={() => setCurrentTab('reports')} 
                className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 px-3 md:px-4 py-2.5 md:py-3.5 rounded-xl transition-all duration-300 whitespace-nowrap ${currentTab === 'reports' ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/50 scale-100 md:scale-105' : 'bg-stone-800 md:bg-transparent hover:bg-stone-700 md:hover:bg-stone-800 hover:text-white'}`}
                title="پیشاندانی داواکارییەکان و بەشی گەڕان"
              >
                  <FileText size={20} />
                  <span className="text-sm md:text-base">ڕاپۆرتەکان</span>
              </button>

              <button 
                onClick={() => setCurrentTab('accounting')} 
                className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 px-3 md:px-4 py-2.5 md:py-3.5 rounded-xl transition-all duration-300 whitespace-nowrap ${currentTab === 'accounting' ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/50 scale-100 md:scale-105' : 'bg-stone-800 md:bg-transparent hover:bg-stone-700 md:hover:bg-stone-800 hover:text-white'}`}
                title="ژمێریاری و ئامارەکانی داهات"
              >
                  <Calculator size={20} />
                  <span className="text-sm md:text-base">ژمێریاری</span>
              </button>
          </div>
          
          {/* دوگمەی چوونەدەرەوە بۆ دیسکتۆپ */}
          <div className="hidden md:flex flex-col p-4 border-t border-stone-800 mt-auto gap-3">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stone-800 text-stone-400 hover:bg-red-600 hover:text-white transition-all font-bold"
                title="چوونەدەرەوە لە سیستەم"
              >
                <LogOut size={18} />
                چوونەدەرەوە
              </button>
              <div className="text-center text-[10px] text-stone-600">
                  گەشەپێدراوە لەلایەن AI © 2026
              </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative h-full w-full">
          
          {toastMessage.text && (
            <div className={`fixed top-4 md:top-6 left-1/2 -translate-x-1/2 px-4 md:px-6 py-2.5 md:py-3 rounded-2xl shadow-xl flex items-center gap-2 md:gap-3 z-50 animate-bounce text-sm md:text-base whitespace-nowrap w-[90%] md:w-auto justify-center ${toastMessage.type === 'error' ? 'bg-red-100 text-red-800 border-2 border-red-200' : 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200'}`}>
              <CheckCircle size={18} className={`shrink-0 ${toastMessage.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`} />
              <span className="font-bold truncate">{toastMessage.text}</span>
            </div>
          )}

          {currentTab === 'new' ? (
            <div className="max-w-4xl mx-auto pb-6 md:pb-10">
              <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-stone-200/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-2xl pointer-events-none"></div>
                
                <div className="flex justify-between items-center mb-6 md:mb-8 relative z-10">
                  <h2 className="text-xl md:text-2xl font-bold text-stone-800 flex items-center gap-2 md:gap-3">
                    <div className={`p-1.5 md:p-2 rounded-lg ${editingId ? 'bg-blue-100 text-blue-600' : 'bg-blue-100 text-blue-600'}`}>
                      {editingId ? <Edit size={20} className="md:w-6 md:h-6" /> : <Package size={20} className="md:w-6 md:h-6" />}
                    </div>
                    {editingId ? 'دەستکاریکردنی داواکاری' : 'تۆمارکردنی داواکاری'}
                  </h2>
                  {editingId && (
                    <button 
                      onClick={() => {
                        setEditingId(null);
                        setFormData({...initialFormState, invoiceNumber: generateInvoiceNumber()});
                        setCurrentTab('reports');
                      }}
                      className="text-stone-400 hover:text-stone-700 bg-stone-100 p-1.5 md:p-2 rounded-full transition"
                      title="داخستنی بەشی دەستکاریکردن"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-10">
                  <div>
                      <label className="block text-xs md:text-sm font-bold text-stone-700 mb-1.5 md:mb-2">ژمارەی پسوڵە</label>
                      <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={formData.invoiceNumber} 
                            disabled={!!editingId}
                            onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} 
                            className={`w-full p-2.5 md:p-3 rounded-xl border border-stone-300 outline-none transition font-mono text-base md:text-lg font-bold ${editingId ? 'bg-stone-200 text-stone-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-stone-50 text-blue-800'}`} 
                            dir="ltr"
                          />
                          {!editingId && (
                            <button 
                              onClick={() => setFormData({...formData, invoiceNumber: generateInvoiceNumber()})} 
                              className="px-3 md:px-4 py-2 md:py-2 bg-stone-200 text-stone-700 rounded-xl hover:bg-stone-300 transition font-bold whitespace-nowrap text-sm"
                              title="دروستکردنی ژمارەیەکی نوێی پسوڵە"
                            >
                              نوێ
                            </button>
                          )}
                      </div>
                      {editingId && <span className="text-[10px] md:text-xs text-red-500 mt-1 font-semibold">ژمارەی پسوڵە گۆڕانکاری تێدا ناکرێت</span>}
                  </div>
                  
                  <div>
                      <label className="block text-xs md:text-sm font-bold text-stone-700 mb-1.5 md:mb-2">ناوی کڕیار <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"><User size={16} /></div>
                        <input 
                          type="text" 
                          value={formData.customerName} 
                          onChange={(e) => setFormData({...formData, customerName: e.target.value})} 
                          className="w-full p-2.5 md:p-3 pr-9 md:pr-10 rounded-xl border border-stone-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm md:text-base" 
                          placeholder="ناوی سیانی"
                        />
                      </div>
                  </div>

                  <div>
                      <label className="block text-xs md:text-sm font-bold text-stone-700 mb-1.5 md:mb-2">ژمارە مۆبایل</label>
                      <div className="relative">
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"><Phone size={16} /></div>
                        <input 
                          type="text" 
                          value={formData.phone} 
                          onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                          className="w-full p-2.5 md:p-3 pr-9 md:pr-10 rounded-xl border border-stone-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-mono text-sm md:text-base" 
                          dir="ltr"
                          placeholder="0750 XXX XXXX"
                        />
                      </div>
                  </div>
                  
                  <div>
                      <label className="block text-xs md:text-sm font-bold text-stone-700 mb-1.5 md:mb-2">ناونیشان بە تەواوی</label>
                      <div className="relative">
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"><MapPin size={16} /></div>
                        <input 
                          type="text" 
                          value={formData.address} 
                          onChange={(e) => setFormData({...formData, address: e.target.value})} 
                          className="w-full p-2.5 md:p-3 pr-9 md:pr-10 rounded-xl border border-stone-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm md:text-base" 
                          placeholder="شار - گەڕەک - نزیک..."
                        />
                      </div>
                  </div>

                  <div className="md:col-span-2 mt-2 p-3 md:p-5 bg-stone-50 rounded-2xl border border-stone-200 shadow-inner">
                    <div className="flex justify-between items-center mb-3 md:mb-4">
                       <label className="block text-sm md:text-base font-bold text-stone-800">کاڵاکان <span className="text-red-500">*</span></label>
                       <button type="button" onClick={handleAddItem} className="flex items-center gap-1 md:gap-1.5 text-xs md:text-sm bg-blue-100 text-blue-700 px-3 md:px-4 py-1.5 md:py-2 rounded-xl hover:bg-blue-200 hover:text-blue-800 transition font-bold shadow-sm" title="کاڵایەکی تر زیاد بکە بۆ پسوڵەکە">
                         <PlusCircle size={16} /> زیادکردن
                       </button>
                    </div>

                    {formData.items.map((item, index) => (
                      <div key={index} className="flex gap-2 md:gap-3 mb-2.5 md:mb-3 items-start duration-300">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="ناوی کاڵا..."
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            className="w-full p-2.5 md:p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-sm md:text-base"
                          />
                        </div>
                        <div className="w-[100px] md:w-1/3 md:min-w-[120px]">
                          <div className="relative">
                            <input
                              type="number"
                              placeholder="نرخ"
                              value={item.price}
                              onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                              className="w-full p-2.5 md:p-3 pr-8 md:pr-10 rounded-xl border border-stone-300 focus:ring-2 focus:ring-blue-500 outline-none transition bg-white font-mono text-sm md:text-base"
                              dir="ltr"
                            />
                            <span className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-stone-400 text-[10px] md:text-xs font-bold pointer-events-none">IQD</span>
                          </div>
                        </div>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-2.5 md:p-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition shrink-0"
                            title="سڕینەوەی ئەم کاڵایە"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}

                    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 md:mt-6 pt-4 md:pt-5 border-t border-stone-200 gap-3 md:gap-4">
                       <div className="w-full sm:w-1/3">
                          <label className="block text-xs md:text-sm font-bold text-stone-700 mb-1.5 md:mb-2">نرخی گەیاندن</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={formData.deliveryFee}
                              onChange={(e) => setFormData({...formData, deliveryFee: e.target.value})}
                              className="w-full p-2.5 md:p-3 pr-8 md:pr-10 rounded-xl border border-stone-300 focus:ring-2 focus:ring-blue-500 outline-none transition bg-white font-mono text-sm md:text-base"
                              dir="ltr"
                              placeholder="0"
                            />
                            <span className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-stone-400 text-[10px] md:text-xs font-bold pointer-events-none">IQD</span>
                          </div>
                       </div>
                       
                       <div className="w-full sm:w-auto bg-blue-50 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-blue-200 flex justify-between sm:block">
                          <span className="text-stone-700 font-bold ml-2 md:ml-3 text-sm md:text-base">کۆی گشتی:</span>
                          <span className="text-lg md:text-2xl font-black text-blue-700 font-mono" dir="ltr">
                             {calculateTotal(formData.items, formData.deliveryFee).toLocaleString()} <span className="text-[10px] md:text-sm">IQD</span>
                          </span>
                       </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                      <label className="block text-xs md:text-sm font-bold text-stone-700 mb-1.5 md:mb-2">وردەکارییەکان (ئارەزوومەندانە)</label>
                      <textarea 
                        rows="3" 
                        value={formData.details} 
                        onChange={(e) => setFormData({...formData, details: e.target.value})} 
                        className="w-full p-3 md:p-4 rounded-xl border border-stone-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none leading-relaxed text-sm md:text-base"
                        placeholder="جۆری کاڵا، قەبارە، ڕەنگ..."
                      ></textarea>
                  </div>

                  <div className="md:col-span-2">
                      <label className="block text-xs md:text-sm font-bold text-stone-700 mb-1.5 md:mb-2">تێبینییەکان (ئارەزوومەندانە)</label>
                      <textarea 
                        rows="2" 
                        value={formData.notes} 
                        onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                        className="w-full p-3 md:p-4 rounded-xl border border-stone-300 focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition resize-none text-stone-600 text-sm md:text-base"
                        placeholder="هەر تێبینییەکی تایبەت سەبارەت بە گەیاندن یان دیزاین..."
                      ></textarea>
                  </div>
                </div>
                
                <div className="mt-6 md:mt-8 flex flex-col sm:flex-row justify-end gap-3 md:gap-4 border-t border-stone-100 pt-5 md:pt-6 relative z-10">
                    <button 
                      onClick={() => handleSave(false)} 
                      className="w-full sm:w-auto px-4 md:px-6 py-3 rounded-xl border-2 border-stone-300 text-stone-700 hover:bg-stone-50 hover:border-blue-500 hover:text-blue-700 font-bold transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                      title="پاشەکەوتکردنی زانیارییەکان لەناو داتابەیس بەبێ چاپکردن"
                    >
                        <Save size={18} />
                        {editingId ? 'نوێکردنەوە' : 'تەنها پاشەکەوتکردن'}
                    </button>
                    <button 
                      onClick={() => handleSave(true)} 
                      className="w-full sm:w-auto px-6 md:px-8 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 text-sm md:text-base"
                      title="پاشەکەوتکردنی داواکارییەکە و کردنەوەی پەنجەرەی چاپکردن"
                    >
                        <Printer size={18} />
                        {editingId ? 'نوێکردنەوە و چاپکردن' : 'پاشەکەوتکردن و چاپکردن'}
                    </button>
                </div>
              </div>
            </div>
          ) : currentTab === 'reports' ? (
            <div className="max-w-6xl mx-auto h-full flex flex-col pb-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 md:mb-8 gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-stone-200/60 w-full">
                 <div className="flex flex-col gap-3 md:gap-4 w-full lg:w-auto">
                   <h2 className="text-xl md:text-2xl font-bold text-stone-800 flex items-center gap-2 md:gap-3">
                     <div className="p-1.5 md:p-2 bg-stone-100 text-stone-600 rounded-lg">
                       <FileText size={20} className="md:w-6 md:h-6" />
                     </div>
                     ڕاپۆرتەکان
                   </h2>
                   
                   {/* بەشی لیست و تابەکانی ڕاپۆرتەکان */}
                   <div className="flex gap-1.5 md:gap-2 bg-stone-100 p-1.5 rounded-xl w-full overflow-x-auto hide-scrollbar">
                      <button 
                        onClick={() => setReportTab('pending')} 
                        className={`flex-1 min-w-fit px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition flex items-center justify-center gap-1.5 md:gap-2 ${reportTab === 'pending' ? 'bg-white shadow-sm text-blue-600' : 'text-stone-500 hover:text-stone-700'}`} 
                        title="پیشاندانی ئەو داواکارییانەی کە ئێستا لە ئامادەکردندان"
                      >
                        <Clock size={16}/> 
                        لە ئامادەکردندایە
                      </button>
                      <button 
                        onClick={() => setReportTab('on_way')} 
                        className={`flex-1 min-w-fit px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition flex items-center justify-center gap-1.5 md:gap-2 ${reportTab === 'on_way' ? 'bg-white shadow-sm text-indigo-600' : 'text-stone-500 hover:text-stone-700'}`} 
                        title="پیشاندانی ئەو داواکارییانەی کە نێردراون و لە ڕێگان بۆ کڕیار"
                      >
                        <Truck size={16}/> 
                        لە ڕێگایە
                      </button>
                      <button 
                        onClick={() => setReportTab('completed')} 
                        className={`flex-1 min-w-fit px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition flex items-center justify-center gap-1.5 md:gap-2 ${reportTab === 'completed' ? 'bg-white shadow-sm text-emerald-600' : 'text-stone-500 hover:text-stone-700'}`} 
                        title="پیشاندانی ئەو داواکارییانەی کە تەواو بوون و ڕادەستکراون"
                      >
                        <CheckCircle size={16}/> 
                        تەواوبوو
                      </button>
                      <button 
                        onClick={() => setReportTab('returned')} 
                        className={`flex-1 min-w-fit px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition flex items-center justify-center gap-1.5 md:gap-2 ${reportTab === 'returned' ? 'bg-white shadow-sm text-orange-600' : 'text-stone-500 hover:text-stone-700'}`} 
                        title="پیشاندانی ئەو داواکارییانەی کە گەڕێندراونەتەوە"
                      >
                        <RotateCcw size={16}/> 
                        گەڕاوە
                      </button>
                   </div>
                 </div>

                 <div className="relative w-full lg:w-80 shrink-0 mt-2 lg:mt-0">
                   <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-stone-400"><Search size={18} /></div>
                   <input 
                     type="text" 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="گەڕان بەدوای پسوڵە، ناو، مۆبایل..." 
                     className="w-full p-2.5 md:p-3 pr-10 md:pr-12 rounded-xl md:rounded-2xl border border-stone-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-stone-50 text-sm md:text-base"
                   />
                 </div>
              </div>

              {loadingOrders ? (
                <div className="flex-1 flex items-center justify-center py-10">
                  <Loader className="animate-spin text-blue-600" size={32} />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-400 gap-3 md:gap-4 py-16 md:mt-20">
                  <Package size={48} className="opacity-20 md:w-16 md:h-16" />
                  <p className="text-base md:text-xl font-medium">هیچ داواکارییەک نەدۆزرایەوە لەم بەشەدا</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-stone-200/80 p-4 md:p-5 hover:shadow-md hover:border-blue-300 transition-all duration-300 group flex flex-col relative overflow-hidden">
                      {/* نیشانەی ڕەنگاوڕەنگ بەپێی دۆخی داواکارییەکە */}
                      <div className={`absolute top-0 bottom-0 right-0 w-1 md:w-1.5 ${
                        (order.status || 'pending') === 'completed' ? 'bg-emerald-500' : 
                        (order.status || 'pending') === 'returned' ? 'bg-orange-500' : 
                        (order.status || 'pending') === 'on_way' ? 'bg-indigo-500' : 'bg-blue-500'
                      }`}></div>
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 mb-3 md:mb-4 border-b border-stone-100 pb-3 pl-1">
                        <div>
                          <span className="text-[9px] md:text-[10px] text-stone-500 font-bold uppercase tracking-wider block mb-0.5 md:mb-1">ژمارەی پسوڵە</span>
                          <h3 className="font-bold text-base md:text-lg text-blue-700 font-mono" dir="ltr">{order.invoiceNumber}</h3>
                        </div>
                        
                        <div className="flex gap-1 md:gap-1.5 flex-wrap justify-end w-full sm:w-auto">
                          {/* دوگمەکانی گۆڕینی دۆخ بەپێی ئەوەی لە کام تابەداین */}
                          {reportTab === 'pending' && (
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'on_way')} 
                              className="p-1.5 md:p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                              title="گواستنەوە بۆ بەشی (لە ڕێگایە)"
                            >
                              <Truck size={16} className="md:w-[18px] md:h-[18px]" />
                            </button>
                          )}
                          
                          {reportTab === 'on_way' && (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(order.id, 'completed')} 
                                className="p-1.5 md:p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                                title="دیاریکردن وەک (تەواوبوو)"
                              >
                                <Check size={16} className="md:w-[18px] md:h-[18px]" />
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(order.id, 'pending')} 
                                className="p-1.5 md:p-2 bg-stone-50 text-stone-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-stone-200"
                                title="گێڕانەوە بۆ بەشی (لە ئامادەکردندایە)"
                              >
                                <Clock size={16} className="md:w-[18px] md:h-[18px]" />
                              </button>
                            </>
                          )}

                          {(reportTab === 'completed' || reportTab === 'returned') && (
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'pending')} 
                              className="p-1.5 md:p-2 bg-stone-50 text-stone-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-stone-200"
                              title="گێڕانەوە بۆ بەشی (لە ئامادەکردندایە)"
                            >
                              <Clock size={16} className="md:w-[18px] md:h-[18px]" />
                            </button>
                          )}

                          {reportTab !== 'returned' && (
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'returned')} 
                              className="p-1.5 md:p-2 bg-stone-50 text-stone-500 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-colors border border-stone-200"
                              title="دیاریکردن وەک (داواکاری گەڕاوە)"
                            >
                              <RotateCcw size={16} className="md:w-[18px] md:h-[18px]" />
                            </button>
                          )}

                          <button 
                            onClick={() => handlePrintExisting(order)} 
                            className="p-1.5 md:p-2 bg-stone-50 text-stone-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-stone-200"
                            title="چاپکردنی ئەم پسوڵەیە"
                          >
                            <Printer size={16} className="md:w-[18px] md:h-[18px]" />
                          </button>
                          <button 
                            onClick={() => handleEdit(order)} 
                            className="p-1.5 md:p-2 bg-stone-50 text-stone-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-stone-200"
                            title="دەستکاریکردنی زانیارییەکان"
                          >
                            <Edit size={16} className="md:w-[18px] md:h-[18px]" />
                          </button>
                          <button 
                            onClick={() => setDeleteModal({ isOpen: true, orderId: order.id })} 
                            className="p-1.5 md:p-2 bg-stone-50 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-stone-200"
                            title="سڕینەوە بە یەکجاری"
                          >
                            <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 md:space-y-3 flex-1 pl-1">
                        <div className="flex items-center gap-2 md:gap-3">
                           <div className="p-1 md:p-1.5 bg-stone-100 rounded-lg text-stone-500"><User size={12} className="md:w-3.5 md:h-3.5" /></div>
                           <span className="font-bold text-stone-800 text-sm md:text-base truncate">{order.customerName}</span>
                        </div>
                        {order.phone && (
                        <div className="flex items-center gap-2 md:gap-3">
                           <div className="p-1 md:p-1.5 bg-stone-100 rounded-lg text-stone-500"><Phone size={12} className="md:w-3.5 md:h-3.5" /></div>
                           <span className="text-stone-600 text-xs md:text-sm font-mono" dir="ltr">{order.phone}</span>
                        </div>
                        )}
                        <div className="flex items-center gap-2 md:gap-3">
                           <div className="p-1 md:p-1.5 bg-stone-100 rounded-lg text-stone-500"><Calendar size={12} className="md:w-3.5 md:h-3.5" /></div>
                           <span className="text-stone-500 text-[10px] md:text-xs">{formatDate(order.createdAt)}</span>
                        </div>
                        
                        {order.items && order.items.length > 0 && order.items[0].name && (
                          <div className="mt-3 md:mt-4 bg-blue-50/50 rounded-lg md:rounded-xl p-2.5 md:p-3 border border-blue-100">
                            <h4 className="text-[10px] md:text-[11px] font-bold text-blue-800 mb-1.5 md:mb-2 border-b border-blue-200/60 pb-1">لیستی کاڵاکان:</h4>
                            <ul className="space-y-1 md:space-y-1.5">
                              {order.items.map((item, idx) => item.name && (
                                <li key={idx} className="flex justify-between items-center text-[11px] md:text-xs">
                                   <span className="text-stone-700 font-medium">{item.name}</span>
                                   <span className="text-stone-900 font-mono font-bold" dir="ltr">{(Number(item.price)||0).toLocaleString()} IQD</span>
                                </li>
                              ))}
                            </ul>
                            {order.deliveryFee && (
                              <div className="flex justify-between items-center text-[11px] md:text-xs mt-1.5 md:mt-2 pt-1.5 md:pt-2 border-t border-blue-200/60">
                                 <span className="text-blue-800 font-bold">کرێی گەیاندن:</span>
                                 <span className="text-stone-900 font-mono font-bold" dir="ltr">{(Number(order.deliveryFee)||0).toLocaleString()} IQD</span>
                              </div>
                            )}
                          </div>
                        )}

                        {(order.items || order.deliveryFee) && (
                          <div className="mt-2 flex justify-between items-center bg-stone-100 p-2 md:p-2.5 rounded-lg border border-stone-200">
                            <span className="text-xs md:text-sm font-black text-stone-700">کۆی گشتی:</span>
                            <span className="font-black text-blue-700 font-mono text-sm md:text-lg" dir="ltr">
                              {calculateTotal(order.items, order.deliveryFee).toLocaleString()} <span className="text-[9px] md:text-xs">IQD</span>
                            </span>
                          </div>
                        )}

                        {order.details && (
                          <div className="mt-2 p-2.5 md:p-3 bg-stone-50 rounded-lg md:rounded-xl text-xs md:text-sm text-stone-700 whitespace-pre-wrap leading-relaxed border border-stone-100">
                            {order.details}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* --- بەشی ژمێریاری (Accounting) --- */
            <div className="max-w-4xl mx-auto pb-10">
              <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-stone-200/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-2xl pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 relative z-10">
                  <h2 className="text-xl md:text-2xl font-bold text-stone-800 flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Calculator size={20} className="md:w-6 md:h-6" />
                    </div>
                    ژمێریاری و ئامارەکان
                  </h2>
                  
                  {/* فلتەری بەروار */}
                  <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200 w-full md:w-auto">
                    <div className="flex-1 md:w-36">
                      <label className="block text-[10px] text-stone-500 font-bold mb-1">لە بەرواری</label>
                      <input 
                        type="date" 
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                        className="w-full p-1.5 bg-white border border-stone-200 rounded-lg text-xs md:text-sm outline-none focus:border-blue-400"
                      />
                    </div>
                    <span className="text-stone-400 font-bold mt-4">-</span>
                    <div className="flex-1 md:w-36">
                      <label className="block text-[10px] text-stone-500 font-bold mb-1">بۆ بەرواری</label>
                      <input 
                        type="date" 
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                        className="w-full p-1.5 bg-white border border-stone-200 rounded-lg text-xs md:text-sm outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6 text-center text-sm md:text-base text-blue-800 font-medium">
                  ئامارەکانی نێوان <span className="font-bold font-mono" dir="ltr">{dateRange.startDate}</span> و <span className="font-bold font-mono" dir="ltr">{dateRange.endDate}</span> پیشان دەدات. لەم ماوەیەدا (<span className="font-bold">{accountingData.orderCount}</span>) داواکاری تۆمارکراون.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-10">
                  {/* کارتی کۆی گشتی پارەکان */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-stone-100 text-stone-600 rounded-lg"><Package size={18} /></div>
                      <h3 className="font-bold text-stone-600 text-sm">کۆی گشتی هەموو داواکارییەکان</h3>
                    </div>
                    <p className="text-[10px] text-stone-400 mb-4">پارەی گشت داواکارییەکان بەبێ گوێدانە دۆخەکەیان</p>
                    <div className="text-xl md:text-2xl font-black text-stone-800 font-mono" dir="ltr">
                      {accountingData.stats.totalRevenue.toLocaleString()} <span className="text-sm font-bold text-stone-500">IQD</span>
                    </div>
                  </div>

                  {/* کارتی پارەی گەڕاوەکان */}
                  <div className="bg-orange-50/50 rounded-2xl border border-orange-100 p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><RotateCcw size={18} /></div>
                      <h3 className="font-bold text-orange-700 text-sm">پارەی داواکارییە گەڕاوەکان</h3>
                    </div>
                    <p className="text-[10px] text-orange-500/80 mb-4">ئەو پارەیەی کە گەڕاوەتەوە و نەبووەتە داهات</p>
                    <div className="text-xl md:text-2xl font-black text-orange-700 font-mono" dir="ltr">
                      {accountingData.stats.returnedRevenue.toLocaleString()} <span className="text-sm font-bold text-orange-500">IQD</span>
                    </div>
                  </div>

                  {/* کارتی کرێی گەیاندن */}
                  <div className="bg-stone-50 rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-stone-200 text-stone-700 rounded-lg"><TruckIcon size={18} /></div>
                      <h3 className="font-bold text-stone-700 text-sm">کۆی کرێی گەیاندن</h3>
                    </div>
                    <p className="text-[10px] text-stone-500 mb-4">کۆی گشتی کرێی گەیاندن تەنها بۆ داواکارییە تەواوبووەکان</p>
                    <div className="text-xl md:text-2xl font-black text-stone-700 font-mono" dir="ltr">
                      {accountingData.stats.totalDeliveryFees.toLocaleString()} <span className="text-sm font-bold text-stone-500">IQD</span>
                    </div>
                  </div>

                  {/* کارتی قازانجی سافی */}
                  <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 shadow-md hover:shadow-lg transition relative overflow-hidden transform hover:-translate-y-1">
                    <div className="absolute -right-4 -bottom-4 text-emerald-100"><TrendingUp size={100} /></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500 text-white rounded-lg shadow-sm"><DollarSign size={18} /></div>
                        <h3 className="font-bold text-emerald-800 text-base md:text-lg">قازانجی سافی</h3>
                      </div>
                      <p className="text-[11px] text-emerald-600 mb-4 font-medium leading-relaxed">
                        کۆی پارەی داواکارییە گەیشتووەکان کەم کرێی گەیاندنەکەیان
                        <br/>
                        <span className="opacity-70 text-[9px]">(پارەی گەیشتووەکان: {accountingData.stats.completedRevenue.toLocaleString()})</span>
                      </p>
                      <div className="text-2xl md:text-3xl font-black text-emerald-600 font-mono" dir="ltr">
                        {accountingData.stats.netProfit.toLocaleString()} <span className="text-base font-bold text-emerald-500">IQD</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
