import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Calendar, ChevronRight, CheckCircle, Clock, Trash2, UserPlus, 
  Download, LogOut, Plus, LayoutDashboard, ClipboardCheck, IndianRupee, 
  Menu as MenuIcon, X, CreditCard, MapPin, Users2, ShieldCheck, ChevronDown,
  Star, Utensils, Award, TrendingUp, Search, UserCheck, AlertCircle, Mail, Lock, User,
  ShieldAlert, Sparkles, PlusCircle, LogIn, UserPlus2, Info, List, Copy, Phone, MessageSquare,
  Home, Heart, ChefHat, MapPinned, Send, UtensilsCrossed
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref as dbRef, push, set, onValue, update as updateRtdb, remove } from 'firebase/database';
import { getFirestore, collection, addDoc, onSnapshot, query as fsQuery, where, updateDoc, doc } from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';

// --- INITIALIZATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDgqKxRv4DoIRDKY_A4pTzet66Dp8ICLr0",
  authDomain: "maa-bhawani-catering.firebaseapp.com",
  databaseURL: "https://maa-bhawani-catering-default-rtdb.firebaseio.com/",
  projectId: "maa-bhawani-catering",
  storageBucket: "maa-bhawani-catering.firebasestorage.app",
  messagingSenderId: "816368894543",
  appId: "1:816368894543:web:1e5792d112f80c50fd603a",
  measurementId: "G-Z3NGRCTL70"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const rtdb = getDatabase(app);
const db = getFirestore(app);
const appId = 'maa-bhawani-prod-2026';
const rtdbRootPath = `artifacts/${appId}/public/data`;
const staffPath = `${rtdbRootPath}/staff`;
const attendancePath = `${rtdbRootPath}/attendance`;
const reviewsPath = `${rtdbRootPath}/reviews`;

// --- CONSTANTS ---
const HELPER_RATE = 300; 
const CONTRACTOR_RATE = 1000;
const PRICING_RATE = 15000; 
const ADMIN_EMAIL = "maabhawani2026@gmail.com";

const DEFAULT_STAFF = [
  "Adarsh Rajurkar (Contractor)", "Prajwal Hawge", "Nikhil Shende", "Amit Kavre", 
  "Manish Raut", "Shrawan Salankar", "Harsh Chole", "Yash Bhopale", 
  "Om Chatarkar", "Mayur Bhange", "Navnit Wanjari", "Sarthak Mohekar", 
  "Himanshu Dhange", "Karan Aatram", "Mayur Aatram"
];

const MENU_DATA = {
  "Welcome Drinks": ["Sol Kadhi", "Kairi Panha", "Kokum Sarbat", "Piyush", "Mattha", "Amba Panha"],
  "Snacks": ["Kothimbir Vadi", "Alu Vadi", "Sabudana Wada", "Batata Vada", "Thalipeeth", "Misal Pav", "Kanda Bhaji", "Chakli", "Surali Wadi"],
  "Veg Main Course": ["Bharli Vangi", "Patal Bhaji", "Zunka", "Shev Bhaji", "Batata Suva Bhaji", "Vangi Batata Rassa", "Phansachi Bhaji", "Walachi Usal"],
  "Usal": ["Matki Usal", "Moongachi Gathi", "Chavali Chi Usal", "Watana Usal"],
  "Dal / Kadhi": ["Katachi Amti", "Varan", "Gola Bhaat chi Amti", "Fodniche Varan", "Maharashtrian Kadhi"],
  "Rice": ["Masala Bhaat", "Vangi Bhaat", "Varan Bhaat", "Dalimbay Bhaat", "Khichdi", "Gola Bhaat"],
  "Breads": ["Chapati / Poli", "Jowar Bhakri", "Bajra Bhakri", "Tandlachi Bhakri", "Ghadichi Poli"],
  "Accompaniments": ["Green Chilli Thecha", "Khamang Kakdi", "Koshimbir", "Kurdai / Papad / Mirgund", "Lonche", "Shengdana Chutney"],
  "Sweets": ["Puran Poli", "Shrikhand / Amrakhand", "Ukadiche Modak", "Gulachi Poli", "Basundi", "Kharvas", "Anarsa", "Shevaya chi Kheer"],
  "Non-Veg": ["Tambada Rassa", "Pandhara Rassa", "Kolhapuri Sukka Mutton", "Malvani Fish Curry", "Fried Bombil", "Kombdi Vade"]
};

const calculateCost = (count) => (count / 100) * PRICING_RATE;

const copyToClipboard = (text) => {
  const el = document.createElement('textarea');
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

// --- SHARED UI COMPONENTS ---

const CateringLogo = ({ className = "h-12 w-auto", showText = true }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-xl shadow-lg shadow-yellow-200 flex-shrink-0">
      <Utensils className="text-white w-6 h-6 sm:w-7 sm:h-7" />
    </div>
    {showText && (
      <div className="flex flex-col min-w-0">
        <span className="font-black text-base sm:text-xl leading-none text-gray-900 tracking-tight whitespace-nowrap">MAA BHAWANI</span>
        <span className="hidden sm:block text-[10px] font-bold text-yellow-600 tracking-[0.2em] uppercase whitespace-nowrap">Catering Services</span>
      </div>
    )}
  </div>
);

function SidebarItem({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${active ? 'bg-yellow-500 text-white shadow-xl shadow-yellow-100/50' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}>
      {icon} <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon, trend }) {
  return (
    <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[45px] shadow-sm border border-gray-100 flex items-center justify-between gap-4 hover:shadow-xl transition-all duration-300">
      <div>
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{label}</p>
        <h3 className="text-3xl md:text-4xl font-black mt-2 text-gray-900 break-words">{value}</h3>
        {trend && <p className="text-xs text-green-500 font-bold mt-2">{trend}</p>}
      </div>
      <div className="p-5 bg-gray-50 rounded-2xl text-gray-600">{icon}</div>
    </div>
  );
}

// --- MODALS ---

function BookingModal({ user, onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ eventType: 'Wedding', date: '', eventTime: '', eventShift: 'Day', phone: '', guests: 100, thalis: 100, helpers: 5, address: '', menu: [], txnId: '' });
  const cost = calculateCost(form.thalis);

  const toggle = (item) => setForm(p => ({ ...p, menu: p.menu.includes(item) ? p.menu.filter(i => i !== item) : [...p.menu, item] }));
  
  const submit = async () => {
    if(!form.txnId) return alert("UTR Reference ID required!");
    if(!form.phone || !form.eventTime) return alert("Phone number and event time are required!");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bookings'), {
        ...form, 
        customerEmail: user.email, 
        customerId: auth.currentUser?.uid || user.uid, 
        totalCost: Number(cost) || 0,
        status: 'Pending', 
        paymentStatus: 'pending_verification', 
        createdAt: Date.now(),
      });
      onClose();
    } catch (err) {
      alert("Submission error: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-3xl md:rounded-[60px] h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="bg-yellow-500 p-5 md:p-10 text-white flex justify-between items-center gap-3">
           <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">Booking Setup</h2>
           <button onClick={onClose}><X size={32}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-12">
           {step === 1 && (
             <div className="space-y-8 animate-in slide-in-from-right-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                   <div className="space-y-2">
                     <label className="text-xs font-black uppercase text-gray-400">Category</label>
                     <select className="w-full p-5 bg-gray-50 rounded-2xl font-bold border-none" value={form.eventType} onChange={e => setForm({...form, eventType: e.target.value})}>
                        {["Wedding", "Birthday", "Reception", "Corporate", "Outdoor", "Traditional"].map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-black uppercase text-gray-400">Date</label>
                     <input type="date" required className="w-full p-5 bg-gray-50 rounded-2xl font-bold border-none" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <input type="time" required className="p-5 bg-gray-50 rounded-2xl font-bold" value={form.eventTime} onChange={e => setForm({...form, eventTime: e.target.value})} />
                   <select className="p-5 bg-gray-50 rounded-2xl font-bold border-none" value={form.eventShift} onChange={e => setForm({...form, eventShift: e.target.value})}>
                      <option value="Day">Day</option>
                      <option value="Night">Night</option>
                   </select>
                   <input type="tel" required placeholder="Client Phone Number" className="p-5 bg-gray-50 rounded-2xl font-bold" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8">
                   <input type="number" placeholder="Guests" className="p-5 bg-gray-50 rounded-2xl font-bold" value={form.guests} onChange={e => setForm({...form, guests: e.target.value})} />
                   <input type="number" placeholder="Thalis" className="p-5 bg-yellow-50 text-yellow-700 font-black rounded-2xl border-2 border-yellow-200" value={form.thalis} onChange={e => setForm({...form, thalis: e.target.value})} />
                   <input type="number" placeholder="Helpers" className="p-5 bg-gray-50 rounded-2xl font-bold" value={form.helpers} onChange={e => setForm({...form, helpers: e.target.value})} />
                </div>
                <textarea placeholder="Event Full Address" className="w-full p-6 bg-gray-50 rounded-3xl h-32 border-none font-bold" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                <button onClick={() => setStep(2)} className="w-full py-6 bg-gray-900 text-white font-black rounded-3xl shadow-xl transition-all hover:bg-black">Select Menu &rarr;</button>
             </div>
           )}
           {step === 2 && (
             <div className="space-y-12 animate-in slide-in-from-right-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {Object.entries(MENU_DATA).map(([cat, items]) => (
                     <div key={cat} className="space-y-4">
                        <h4 className="font-black text-yellow-600 uppercase text-xs tracking-widest border-l-2 border-yellow-500 pl-3">{cat}</h4>
                        <div className="space-y-2">
                           {items.map(it => (
                             <button key={it} onClick={() => toggle(it)} className={`w-full p-3 text-left rounded-xl text-xs font-bold border-2 transition-all ${form.menu.includes(it) ? 'bg-yellow-500 border-yellow-500 text-white' : 'bg-white text-gray-400'}`}>{it}</button>
                           ))}
                        </div>
                     </div>
                   ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 sticky bottom-0 bg-white py-4 border-t">
                   <button onClick={() => setStep(1)} className="flex-1 py-4 sm:py-5 bg-gray-100 rounded-2xl font-black">Back</button>
                   <button onClick={() => setStep(3)} className="flex-[2] py-4 sm:py-5 bg-yellow-500 text-white rounded-2xl font-black shadow-xl">Review & Pay ₹{cost.toLocaleString()}</button>
                </div>
             </div>
           )}
           {step === 3 && (
             <div className="text-center space-y-10 animate-in zoom-in-95">
                <div className="bg-gray-900 p-6 md:p-12 rounded-3xl md:rounded-[50px] text-white shadow-2xl space-y-8 max-w-md mx-auto text-left">
                   <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] uppercase font-black opacity-40">Official UPI ID</p>
                        <button onClick={() => copyToClipboard('7875822105-de92@axl')} className="text-yellow-400 hover:scale-110 transition-all"><Copy size={14}/></button>
                      </div>
                      <p className="font-mono font-bold text-base sm:text-xl break-all">7875822105-de92@axl</p>
                   </div>
                   <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] uppercase font-black opacity-40">PhonePe Number</p>
                        <button onClick={() => copyToClipboard('7875822105')} className="text-yellow-400 hover:scale-110 transition-all"><Copy size={14}/></button>
                      </div>
                      <p className="font-mono font-bold text-base sm:text-xl break-all">7875822105</p>
                   </div>
                   <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                      <p className="text-xs uppercase font-black opacity-40">Total Amount</p>
                      <p className="text-3xl sm:text-4xl font-black text-yellow-400">₹{cost.toLocaleString()}</p>
                   </div>
                </div>
                <div className="max-w-md mx-auto space-y-4">
                   <input type="text" placeholder="Transaction Reference (UTR)" className="w-full p-6 bg-gray-50 border-4 border-yellow-500/20 rounded-3xl text-center font-mono uppercase text-lg md:text-2xl tracking-wide md:tracking-widest focus:border-yellow-500 outline-none" value={form.txnId} onChange={e => setForm({...form, txnId: e.target.value})} />
                   <button onClick={submit} className="w-full py-6 bg-yellow-500 text-white font-black rounded-3xl shadow-xl hover:bg-yellow-600 transition-all">Submit Order</button>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function BookingDetailModal({ booking, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl md:rounded-[60px] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
        <div className="bg-gray-900 p-5 md:p-8 text-white flex justify-between items-center">
           <h2 className="text-2xl font-black uppercase tracking-tight">Booking Profile</h2>
           <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-4 md:p-10 space-y-8 overflow-y-auto max-h-[70vh]">
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Client Account</p>
              <p className="font-bold text-gray-900 break-all">{booking.customerEmail}</p>
              <p className="text-sm font-bold text-yellow-700 mt-2">Phone: {booking.phone || "N/A"}</p>
              <p className="text-xs font-bold text-gray-500 mt-1">Time: {booking.eventTime || "N/A"} | Shift: {booking.eventShift || "N/A"}</p>
            </div>
           <div className="p-6 bg-yellow-50 rounded-3xl border border-yellow-100">
              <div className="flex items-center gap-2 mb-2 text-yellow-600"><MapPin size={14} /><p className="text-[10px] font-black uppercase tracking-widest">Venue Address</p></div>
              <p className="font-bold text-gray-900 leading-relaxed italic">{booking.address}</p>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-white border border-gray-100 rounded-3xl shadow-sm"><p className="text-2xl font-black">{booking.guests || 0}</p><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Guests</p></div>
              <div className="p-4 bg-white border border-gray-100 rounded-3xl shadow-sm"><p className="text-2xl font-black">{booking.thalis || 0}</p><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Thalis</p></div>
              <div className="p-4 bg-white border border-gray-100 rounded-3xl shadow-sm"><p className="text-2xl font-black">{booking.helpers || 0}</p><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Staff</p></div>
           </div>
           <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Menu</p>
              <div className="flex flex-wrap gap-2">
                 {booking.menu?.map(m => <span key={m} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold border">{m}</span>)}
              </div>
           </div>
        </div>
        <div className="p-5 md:p-8 border-t flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between sm:items-center bg-gray-50">
           <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Value</p><p className="text-2xl font-black text-gray-900">₹{Number(booking.totalCost || 0).toLocaleString()}</p></div>
           <button onClick={onClose} className="px-6 sm:px-10 py-4 bg-gray-900 text-white rounded-2xl font-black w-full sm:w-auto">Close</button>
        </div>
      </div>
    </div>
  );
}

function InvoiceModal({ booking, onClose }) {
  const total = Number(booking.totalCost || 0);
  const invoiceNo = booking.id?.slice(-8)?.toUpperCase() || "NA";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl md:rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gray-900 text-white p-5 md:p-8 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-60">Invoice</p>
            <h3 className="text-2xl font-black mt-1">#{invoiceNo}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-all"><X size={20} /></button>
        </div>
        <div className="p-4 md:p-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Client</p>
              <p className="font-bold text-gray-900 mt-1 break-all">{booking.customerEmail || "N/A"}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Event Date</p>
              <p className="font-bold text-gray-900 mt-1">{booking.date || "N/A"}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Phone</p>
              <p className="font-bold text-gray-900 mt-1">{booking.phone || "N/A"}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Event Time</p>
              <p className="font-bold text-gray-900 mt-1">{booking.eventTime || "N/A"}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Shift</p>
              <p className="font-bold text-gray-900 mt-1">{booking.eventShift || "N/A"}</p>
            </div>
          </div>
          <div className="p-5 border rounded-2xl space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Event Type</span><span className="font-bold">{booking.eventType || "Event"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Guests</span><span className="font-bold">{booking.guests || 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Thalis</span><span className="font-bold">{booking.thalis || 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Helpers</span><span className="font-bold">{booking.helpers || 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Payment Status</span><span className="font-bold uppercase">{booking.paymentStatus || "pending"}</span></div>
          </div>
          <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-100 flex flex-col sm:flex-row gap-4 sm:gap-0 sm:items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-yellow-700 font-black">Total Amount</p>
              <p className="text-3xl font-black text-gray-900 mt-1">Rs {total.toLocaleString()}</p>
            </div>
            <button onClick={() => window.print()} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">Print</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffAssignmentModal({ booking, staffList, attendance, onClose }) {
  const currentAtt = attendance.filter(a => a.bookingId === booking.id);
  const [tempName, setTempName] = useState('');

  const toggle = async (s) => {
    const rec = currentAtt.find(a => a.staffId === s.id);
    try {
      if (rec) {
        await remove(dbRef(rtdb, `${attendancePath}/${rec.id}`));
      } else {
        const newAttRef = push(dbRef(rtdb, attendancePath));
        await set(newAttRef, {
          bookingId: booking.id,
          staffId: s.id,
          staffName: s.name,
          role: s.role,
          status: 'Present',
          paymentAmount: s.defaultRate || HELPER_RATE,
          isPaid: false,
          eventDate: booking.date,
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      alert("Attendance update failed: " + err.message);
    }
  };

  const addTemp = async () => {
    if(!tempName) return;
    try {
      const tempWorkerName = `${tempName} (Temp)`;
      const newStaffRef = push(dbRef(rtdb, staffPath));
      await set(newStaffRef, {
        name: tempWorkerName,
        role: 'Helper',
        defaultRate: HELPER_RATE,
        isActive: true,
        createdAt: Date.now(),
      });

      const newAttRef = push(dbRef(rtdb, attendancePath));
      await set(newAttRef, {
        bookingId: booking.id,
        staffId: newStaffRef.key,
        staffName: tempWorkerName,
        role: 'Helper',
        status: 'Present',
        paymentAmount: HELPER_RATE,
        isPaid: false,
        eventDate: booking.date,
        createdAt: Date.now(),
      });

      setTempName('');
    } catch (err) {
      alert("Temp worker add failed: " + err.message);
    }
  };

  const setStatus = async (id, stat) => {
    try {
      await updateRtdb(dbRef(rtdb, `${attendancePath}/${id}`), { status: stat });
    } catch (err) {
      alert("Status update failed: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white w-full max-w-6xl rounded-3xl md:rounded-[60px] h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="bg-gray-900 p-5 md:p-10 text-white flex justify-between items-center gap-3">
           <div><h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight">{booking.eventType} / Roster</h2><p className="text-gray-400 mt-1 text-sm sm:text-base font-medium">{booking.date} • Needs {booking.helpers} Workers</p></div>
           <button onClick={onClose}><X size={32}/></button>
        </div>
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
           <div className="w-full lg:w-1/2 p-4 md:p-10 overflow-y-auto lg:border-r bg-gray-50/20 space-y-6">
              <div className="p-6 bg-white rounded-3xl border shadow-sm">
                 <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-4">Add Temporary Worker</p>
                 <div className="flex gap-2">
                    <input type="text" placeholder="Name" className="flex-1 p-3 bg-gray-50 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-yellow-500 transition-all" value={tempName} onChange={e => setTempName(e.target.value)} />
                    <button onClick={addTemp} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest">Assign</button>
                 </div>
              </div>
              <div className="space-y-3">
                 <p className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1 tracking-[0.2em]">Team Roster</p>
                 {staffList.map(s => {
                    const sel = currentAtt.some(a => a.staffId === s.id);
                    return (
                      <button key={s.id} onClick={() => toggle(s)} className={`w-full p-6 rounded-3xl border-2 text-left transition-all flex justify-between items-center ${sel ? 'bg-yellow-500 border-yellow-500 text-white shadow-xl shadow-yellow-100' : 'bg-white border-gray-100'}`}>
                        <div><p className="font-bold text-lg">{s.name}</p><p className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${sel ? 'text-yellow-100' : ''}`}>{s.role}</p></div>
                        {sel ? <CheckCircle/> : <Plus size={20} className="opacity-10"/>}
                      </button>
                    );
                 })}
              </div>
           </div>
           <div className="w-full lg:w-1/2 p-4 md:p-10 overflow-y-auto bg-gray-50/50 space-y-6">
              <h3 className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-8 tracking-[0.2em]">Mark Attendance</h3>
              {currentAtt.map(a => (
                 <div key={a.id} className="bg-white p-5 md:p-8 rounded-3xl md:rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center gap-3"><p className="font-bold text-xl sm:text-2xl text-gray-900 tracking-tighter break-words">{a.staffName}</p><div className={`w-3 h-3 rounded-full ${a.status === 'Present' ? 'bg-green-500 shadow-lg shadow-green-200' : 'bg-red-500 shadow-lg shadow-red-200'}`}></div></div>
                    <div className="flex gap-3">
                       <button onClick={() => setStatus(a.id, 'Present')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${a.status === 'Present' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'}`}>Present</button>
                       <button onClick={() => setStatus(a.id, 'Absent')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${a.status === 'Absent' ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'}`}>Absent</button>
                    </div>
                 </div>
              ))}
              {currentAtt.length === 0 && <div className="text-center py-20 opacity-20"><Users size={64} className="mx-auto mb-4"/><p className="font-black uppercase tracking-widest">Assign staff to start tracking</p></div>}
           </div>
        </div>
      </div>
    </div>
  );
}

function StaffDetailModal({ staff, bookings, onClose }) {
  const markPaid = async (attId) => {
    try {
      await updateRtdb(dbRef(rtdb, `${attendancePath}/${attId}`), { isPaid: true });
    } catch (err) {
      alert("Mark paid failed: " + err.message);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white w-full max-w-3xl rounded-3xl md:rounded-[60px] overflow-hidden shadow-2xl h-[80vh] flex flex-col animate-in zoom-in-95">
        <div className="p-5 md:p-12 bg-yellow-500 text-white flex justify-between items-start gap-3">
           <div><h2 className="text-2xl sm:text-3xl md:text-5xl font-black mb-2 tracking-tighter break-words">{staff.name}</h2><p className="font-black text-yellow-100 uppercase tracking-widest text-xs">{staff.role}</p></div>
           <button onClick={onClose}><X size={32}/></button>
        </div>
        <div className="p-4 md:p-10 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 bg-gray-50/50 border-b">
           <div className="bg-white p-6 rounded-[30px] border border-gray-100 text-center"><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Life Earnings</p><p className="text-3xl sm:text-4xl font-black text-gray-900">₹{staff.stats.earned.toLocaleString()}</p></div>
           <div className="bg-white p-6 rounded-[30px] border border-red-50 text-center"><p className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-1">Pending Amount</p><p className="text-3xl sm:text-4xl font-black text-red-500">₹{staff.stats.pending.toLocaleString()}</p></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-4">
          <h3 className="text-xs font-black uppercase text-gray-400 mb-6 tracking-widest">Payroll Logs</h3>
          {staff.stats.history.map(h => (
            <div key={h.id} className="flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between sm:items-center p-6 bg-white border border-gray-100 rounded-[35px] hover:border-yellow-300 transition-all shadow-sm">
               <div>
                  <p className="font-bold text-lg text-gray-900">{bookings.find(b => b.id === h.bookingId)?.eventType || "Standard Event"}</p>
                  <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${h.status === 'Present' ? 'text-green-500' : 'text-red-400'}`}>{h.status} • {h.eventDate}</p>
               </div>
               <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                  <p className="font-black text-2xl text-gray-900">₹{h.paymentAmount}</p>
                  {!h.isPaid && h.status === 'Present' && (
                    <button onClick={() => markPaid(h.id)} className="text-[10px] font-black text-white bg-gray-900 px-6 py-3 rounded-2xl uppercase tracking-widest hover:bg-black transition-all">Mark Paid</button>
                  )}
                  {h.isPaid && <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-4 py-2 rounded-full">Paid</span>}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- LANDING PAGE ---

function LandingPage({ sessionUser, reviews, onAction, onGoToPortal }) {
  const [reviewName, setReviewName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;
    try {
      const newReviewRef = push(dbRef(rtdb, reviewsPath));
      await set(newReviewRef, {
        name: reviewName,
        comment: reviewComment,
        rating: reviewRating,
        createdAt: Date.now(),
      });
      setReviewName('');
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      alert("Review submit failed: " + err.message);
    }
  };

  return (
    <div className="bg-white scroll-smooth min-h-screen">
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-40 border-b border-gray-100">
         <div className="h-20 px-4 sm:px-6 md:px-10 flex items-center justify-between">
            <CateringLogo className="h-auto" />
            <button
              type="button"
              className="md:hidden p-2 rounded-xl border border-gray-200 text-gray-700"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label="Toggle navigation"
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X size={20} /> : <MenuIcon size={20} />}
            </button>
            <div className="hidden md:flex items-center gap-6">
              <a href="#menu" className="text-sm font-bold text-gray-400 hover:text-yellow-600 transition-all uppercase tracking-widest">Our Menu</a>
              <a href="#about" className="text-sm font-bold text-gray-400 hover:text-yellow-600 transition-all uppercase tracking-widest">Contact</a>
              {sessionUser ? (
                <button onClick={onGoToPortal} className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2">
                  <LayoutDashboard size={18}/> My Portal
                </button>
              ) : (
                <button onClick={() => onAction('login')} className="bg-yellow-500 text-white px-8 py-3 rounded-2xl font-bold uppercase tracking-widest">Login</button>
              )}
            </div>
         </div>
         {mobileNavOpen && (
           <div className="md:hidden px-4 pb-4 border-t border-gray-100 bg-white">
             <div className="flex flex-col gap-3 pt-3">
               <a onClick={() => setMobileNavOpen(false)} href="#menu" className="text-xs font-bold text-gray-500 hover:text-yellow-600 transition-all uppercase tracking-widest">Our Menu</a>
               <a onClick={() => setMobileNavOpen(false)} href="#about" className="text-xs font-bold text-gray-500 hover:text-yellow-600 transition-all uppercase tracking-widest">Contact</a>
               {sessionUser ? (
                 <button onClick={() => { setMobileNavOpen(false); onGoToPortal(); }} className="bg-gray-900 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2">
                   <LayoutDashboard size={18}/> My Portal
                 </button>
               ) : (
                 <button onClick={() => { setMobileNavOpen(false); onAction('login'); }} className="bg-yellow-500 text-white px-5 py-3 rounded-2xl font-bold uppercase tracking-widest">Login</button>
               )}
             </div>
           </div>
         )}
      </nav>

      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 md:px-10 overflow-hidden bg-gradient-to-b from-yellow-50 via-white to-white">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-yellow-200/40 blur-3xl rounded-full"></div>
        <div className="absolute top-8 right-0 w-72 h-72 bg-orange-100/60 blur-3xl rounded-full"></div>
        <div className="relative max-w-6xl mx-auto text-center space-y-7 sm:space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-yellow-200 text-[11px] font-black uppercase tracking-[0.2em] text-yellow-700 shadow-sm">
            <Sparkles size={14} /> Trusted Since 2018
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-tight">Authentic Taste. <br/><span className="text-yellow-500">Professional Service.</span></h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">Wardha and Nagpur's premier choice for traditional catering with disciplined service and elegant presentation.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={() => sessionUser ? onGoToPortal() : onAction('register')} className="px-6 sm:px-10 py-4 sm:py-5 bg-gray-900 text-white rounded-2xl sm:rounded-[24px] font-black text-base sm:text-lg shadow-2xl hover:scale-105 transition-all">Book Your Event</button>
            <a href="#menu" className="px-6 sm:px-10 py-4 sm:py-5 bg-white border border-gray-200 text-gray-900 rounded-2xl sm:rounded-[24px] font-black text-base sm:text-lg hover:border-yellow-400 hover:text-yellow-700 transition-all">Explore Menu</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            <div className="p-5 bg-white/90 border border-gray-100 rounded-2xl shadow-sm"><p className="text-3xl font-black text-gray-900">50+</p><p className="text-[11px] uppercase tracking-widest font-black text-gray-400">Events Served</p></div>
            <div className="p-5 bg-white/90 border border-gray-100 rounded-2xl shadow-sm"><p className="text-3xl font-black text-gray-900">24x7</p><p className="text-[11px] uppercase tracking-widest font-black text-gray-400">Support</p></div>
            <div className="p-5 bg-white/90 border border-gray-100 rounded-2xl shadow-sm"><p className="text-3xl font-black text-gray-900">4.5Star</p><p className="text-[11px] uppercase tracking-widest font-black text-gray-400">Client Delight</p></div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto space-y-8 sm:space-y-12">
        <h2 className="text-3xl sm:text-4xl font-black text-center uppercase tracking-tight">Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
           <div className="p-6 sm:p-10 bg-white border border-gray-100 rounded-3xl sm:rounded-[40px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-center">
              <Heart size={40} className="text-yellow-500 mb-6 mx-auto"/><h3 className="text-2xl font-bold mb-4">Weddings</h3><p className="text-gray-500">Traditional grand feasts.</p>
           </div>
           <div className="p-6 sm:p-10 bg-white border border-gray-100 rounded-3xl sm:rounded-[40px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-center">
              <Star size={40} className="text-yellow-500 mb-6 mx-auto"/><h3 className="text-2xl font-bold mb-4">Birthdays</h3><p className="text-gray-500">Tasty menus for all ages.</p>
           </div>
           <div className="p-6 sm:p-10 bg-white border border-gray-100 rounded-3xl sm:rounded-[40px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-center">
              <Award size={40} className="text-yellow-500 mb-6 mx-auto"/><h3 className="text-2xl font-bold mb-4">Corporate</h3><p className="text-gray-500">Professional buffet service.</p>
           </div>
        </div>
      </section>

      <section id="menu" className="py-16 sm:py-24 px-4 sm:px-6 md:px-10 bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
           <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">Signature Menu</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
              {Object.entries(MENU_DATA).map(([cat, items]) => (
                <div key={cat} className="p-6 sm:p-8 bg-white rounded-3xl sm:rounded-[40px] shadow-sm space-y-5 sm:space-y-6">
                   <h4 className="text-lg sm:text-xl font-black text-yellow-600 uppercase tracking-widest border-b pb-2">{cat}</h4>
                   <div className="flex flex-wrap gap-2">
                      {items.map(it => <span key={it} className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs font-bold uppercase">{it}</span>)}
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-20">
         <div className="space-y-8 sm:space-y-12">
            <h2 className="text-3xl sm:text-5xl font-black">Guest Experiences</h2>
            <div className="space-y-6">
               {reviews.slice(0, 3).map(r => (
                 <div key={r.id} className="p-5 sm:p-8 bg-gray-50 rounded-3xl sm:rounded-[40px] border border-gray-100 shadow-sm italic">
                    <div className="flex gap-1 text-yellow-500 mb-4">{[...Array(r.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor"/>)}</div>
                    <p className="text-base sm:text-lg font-medium text-gray-700 break-words">"{r.comment}"</p>
                    <p className="mt-4 font-black uppercase tracking-widest text-[10px] text-gray-400">— {r.name}</p>
                 </div>
               ))}
            </div>
         </div>
         <div className="bg-white p-6 sm:p-12 rounded-3xl sm:rounded-[60px] shadow-2xl border border-gray-100">
            <h3 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 uppercase tracking-widest">Share Feedback</h3>
            <form onSubmit={submitReview} className="space-y-4">
               <input type="text" placeholder="Name" required value={reviewName} onChange={e => setReviewName(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl border-none outline-none font-bold" />
               <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl">
                  <span className="text-xs font-black text-gray-400 uppercase">Rating</span>
                  <div className="flex gap-2">
                     {[1,2,3,4,5].map(i => (
                        <button type="button" key={i} onClick={() => setReviewRating(i)}><Star size={20} fill={reviewRating >= i ? "#F59E0B" : "none"} color="#F59E0B" /></button>
                     ))}
                  </div>
               </div>
               <textarea placeholder="Your Comment" required value={reviewComment} onChange={e => setReviewComment(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl border-none outline-none font-bold h-32" />
               <button type="submit" className="w-full py-5 bg-yellow-500 text-white font-black rounded-2xl shadow-xl hover:bg-yellow-600 transition-all uppercase tracking-widest">Submit feedback</button>
            </form>
         </div>
      </section>

      <footer id="about" className="py-16 sm:py-24 px-4 sm:px-6 md:px-10 bg-gray-900 text-white rounded-t-3xl sm:rounded-t-[60px]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-20">
           <div className="space-y-8">
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-widest">Contact</h2>
              <div className="space-y-6">
                 <div className="flex gap-4 items-start"><MapPin className="text-yellow-500 flex-shrink-0" /><p className="text-lg font-bold">At Post Virul (aa), Tah-Arvi, Dist-Wardha</p></div>
                 <div className="flex gap-4 items-center"><Phone className="text-yellow-500 flex-shrink-0" /><p className="text-lg font-bold">7875822105</p></div>
              </div>
           </div>
           <div className="flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-white/10 rounded-3xl sm:rounded-[50px] text-center opacity-40">
              <Utensils size={64} className="mb-6" /><p className="font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-xs sm:text-base">Official App</p>
           </div>
        </div>
      </footer>
    </div>
  );
}

// --- AUTH PAGES ---

function AuthPage({ type, onLogin, onSwitch, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getAuthErrorMessage = (err, fallbackPrefix = "Error occurred: ") => {
    if (err?.code === 'auth/invalid-credential') return "Invalid email or password.";
    if (err?.code === 'auth/user-not-found') return "User not found. Register first.";
    if (err?.code === 'auth/wrong-password') return "Invalid email or password.";
    if (err?.code === 'auth/email-already-in-use') return "Email already registered. Login instead.";
    if (err?.code === 'auth/weak-password') return "Password is too weak. Use at least 6 characters.";
    return fallbackPrefix + (err?.message || "Unknown error");
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (type === 'register') {
        const result = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        onLogin({
          email: result.user.email || normalizedEmail,
          role: normalizedEmail === ADMIN_EMAIL ? 'admin' : 'client',
          uid: result.user.uid,
        });
      } else {
        const result = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        onLogin({
          email: result.user.email || normalizedEmail,
          role: normalizedEmail === ADMIN_EMAIL ? 'admin' : 'client',
          uid: result.user.uid,
        });
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally { setLoading(false); }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      const gEmail = (result.user.email || '').toLowerCase();
      onLogin({
        email: gEmail,
        role: gEmail === ADMIN_EMAIL ? 'admin' : 'client',
        uid: result.user.uid,
      });
    } catch (err) {
      setError(getAuthErrorMessage(err, "Google Login Failed: "));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50/30 p-6">
      <div className="bg-white p-6 sm:p-12 rounded-3xl sm:rounded-[50px] shadow-2xl w-full max-w-md border border-yellow-100 relative">
        <button onClick={onBack} className="absolute top-5 left-5 sm:top-8 sm:left-8 text-gray-400 font-bold hover:text-gray-900 transition-all uppercase tracking-widest text-xs">&larr; Back</button>
        <div className="text-center mb-10 mt-10 sm:mt-6 space-y-4"><CateringLogo className="mx-auto flex-col" /><h2 className="text-3xl font-black uppercase tracking-tighter">{type === 'register' ? 'Register' : 'Login'}</h2></div>
        
        <button onClick={handleGoogleAuth} disabled={loading} className="w-full flex items-center justify-center gap-3 py-4 border-2 border-gray-100 rounded-2xl font-bold mb-6 hover:bg-gray-50 transition-all disabled:opacity-50">
            <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" /><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" /><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" /><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" /></svg>
            Sign in with Google
        </button>

        <div className="relative flex items-center mb-6"><div className="flex-grow border-t border-gray-100"></div><span className="mx-4 text-[10px] text-gray-300 font-bold uppercase tracking-widest">or email</span><div className="flex-grow border-t border-gray-100"></div></div>

        <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-yellow-500 transition-all" placeholder="Email" />
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-yellow-500 transition-all" placeholder="Password" />
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 animate-in fade-in">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl shadow-xl transition-all disabled:opacity-50 uppercase tracking-widest">{loading ? 'Working...' : (type === 'register' ? 'Register' : 'Login')}</button>
        </form>
        <button onClick={onSwitch} className="w-full text-center mt-6 text-gray-400 font-bold underline text-sm hover:text-yellow-600 transition-all uppercase tracking-widest">{type === 'register' ? 'Login instead' : 'Register Now'}</button>
      </div>
    </div>
  );
}

// --- APP ENTRY POINT ---

export default function App() {
  const [sessionUser, setSessionUser] = useState(null); 
  const [firebaseUser, setFirebaseUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home'); 
  const [bookings, setBookings] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [reviews, setReviews] = useState([]);
  const seededDefaultStaff = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      if (u) {
        setSessionUser((prev) => {
          const email = (u.email || prev?.email || '').toLowerCase();
          const role = email === ADMIN_EMAIL || prev?.role === 'admin' ? 'admin' : 'client';
          return { email, uid: u.uid || prev?.uid, role };
        });
      } else {
        setSessionUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // PUBLIC DATA LISTENER
    const reviewsRef = dbRef(rtdb, reviewsPath);
    const unsubReviews = onValue(reviewsRef, (snap) => {
      const data = snap.val() ? Object.entries(snap.val()).map(([id, r]) => ({ id, ...r })) : [];
      setReviews(data);
    });

    // SECURE DATA LISTENER
    if (firebaseUser || sessionUser) {
      const activeUser = sessionUser || { email: (firebaseUser?.email || '').toLowerCase(), uid: firebaseUser?.uid, role: 'client' };
      const isAdmin = activeUser.role === 'admin' || activeUser.email?.toLowerCase() === ADMIN_EMAIL;

      let unsubBookings = () => {};
      const bookingsRef = collection(db, 'artifacts', appId, 'public', 'data', 'bookings');

      if (isAdmin) {
        unsubBookings = onSnapshot(bookingsRef, (snap) => {
          const allBookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setBookings(allBookings);
        }, (err) => {
          console.error("Bookings listener failed:", err);
          setBookings([]);
        });
      } else {
        const unsubscribers = [];
        const mergeClientBookings = (uidDocs, emailDocs) => {
          const merged = new Map();
          uidDocs.forEach((d) => merged.set(d.id, d));
          emailDocs.forEach((d) => merged.set(d.id, d));
          setBookings(Array.from(merged.values()));
        };

        let uidBookings = [];
        let emailBookings = [];

        if (activeUser.uid) {
          const qByUid = fsQuery(bookingsRef, where('customerId', '==', activeUser.uid));
          unsubscribers.push(onSnapshot(qByUid, (snap) => {
            uidBookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            mergeClientBookings(uidBookings, emailBookings);
          }, (err) => {
            console.error("Bookings listener (uid) failed:", err);
            setBookings([]);
          }));
        }

        if (activeUser.email) {
          const qByEmail = fsQuery(bookingsRef, where('customerEmail', '==', activeUser.email.toLowerCase()));
          unsubscribers.push(onSnapshot(qByEmail, (snap) => {
            emailBookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            mergeClientBookings(uidBookings, emailBookings);
          }, (err) => {
            console.error("Bookings listener (email) failed:", err);
            setBookings([]);
          }));
        }

        if (!activeUser.uid && !activeUser.email) {
          setBookings([]);
        }

        unsubBookings = () => unsubscribers.forEach((fn) => fn && fn());
      }

      const staffRef = dbRef(rtdb, staffPath);
      const unsubStaff = onValue(staffRef, async (snap) => {
        const data = snap.val() ? Object.entries(snap.val()).map(([id, s]) => ({ id, ...s })) : [];
        setStaffList(data);
        if (data.length === 0 && isAdmin && !seededDefaultStaff.current) {
          seededDefaultStaff.current = true;
          await Promise.all(DEFAULT_STAFF.map(name => {
            const r = push(dbRef(rtdb, staffPath));
            return set(r, { name, role: name.includes("Contractor") ? "Contractor" : "Helper", defaultRate: name.includes("Contractor") ? CONTRACTOR_RATE : HELPER_RATE, isActive: true, createdAt: Date.now() });
          }));
        }
      });

      const attRef = dbRef(rtdb, attendancePath);
      const unsubAtt = onValue(attRef, (snap) => {
        const data = snap.val() ? Object.entries(snap.val()).map(([id, a]) => ({ id, ...a })) : [];
        setAttendance(data);
      });

      return () => { unsubBookings(); unsubStaff(); unsubAtt(); };
    }

    return () => { unsubReviews(); };
  }, [firebaseUser, sessionUser]);

  const handleLoginSuccess = (userData) => { setSessionUser(userData); setView('dashboard'); };
  const handleLogout = async () => { await signOut(auth); setSessionUser(null); setView('home'); };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-500"></div></div>;

  if (['home', 'login', 'register'].includes(view)) {
    if (view === 'home') return <LandingPage sessionUser={sessionUser} reviews={reviews} onAction={setView} onGoToPortal={() => setView('dashboard')} />;
    return <AuthPage type={view} onLogin={handleLoginSuccess} onSwitch={() => setView(view === 'login' ? 'register' : 'login')} onBack={() => setView('home')} />;
  }

  const isAdmin = sessionUser?.email === ADMIN_EMAIL;

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen bg-gray-50 overflow-visible md:overflow-hidden">
      <aside className="w-full md:w-72 bg-white border-r border-gray-100 p-4 sm:p-8 flex flex-col shadow-sm">
        <div className="mb-6 sm:mb-12"><CateringLogo /></div>
        <nav className="flex-1 space-y-2">
          <SidebarItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={20}/>} label="Dashboard" />
          {isAdmin && (
            <>
              <SidebarItem active={view === 'bookings'} onClick={() => setView('bookings')} icon={<Calendar size={20}/>} label="Bookings" />
              <SidebarItem active={view === 'staff'} onClick={() => setView('staff')} icon={<Users2 size={20}/>} label="Roster" />
            </>
          )}
          <SidebarItem active={view === 'home'} onClick={() => setView('home')} icon={<Home size={20}/>} label="Visit Home" />
        </nav>
        <div className="mt-auto pt-6 border-t">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active User</p>
          <p className="text-xs font-bold text-gray-700 truncate mb-4">{sessionUser?.email}</p>
          <button onClick={handleLogout} className="flex items-center justify-center sm:justify-start gap-3 p-4 w-full text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold"><LogOut size={20}/> <span>Sign Out</span></button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-12">
        {view === 'dashboard' && (isAdmin ? <AdminDashboard bookings={bookings} staff={staffList} /> : <UserDashboard user={sessionUser} bookings={bookings} />)}
        {view === 'bookings' && isAdmin && <AdminBookingManager bookings={bookings} staffList={staffList} attendance={attendance} />}
        {view === 'staff' && isAdmin && <StaffManagement staffList={staffList} attendance={attendance} bookings={bookings} />}
      </main>
    </div>
  );
}

// UI PARTS (DASHBOARDS) CONTINUED
function UserDashboard({ user, bookings }) {
  const [showModal, setShowModal] = useState(false);
  const [invoice, setInvoice] = useState(null);

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 md:mb-12">
        <div><h2 className="text-3xl md:text-5xl font-black tracking-tight">Portal</h2><p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-xs break-all">Logged in: {user.email}</p></div>
        <button onClick={() => setShowModal(true)} className="px-6 md:px-10 py-4 md:py-5 bg-yellow-500 text-white rounded-3xl font-black shadow-xl flex gap-2 uppercase tracking-widest text-xs w-full sm:w-auto justify-center"><PlusCircle/> New Order</button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {bookings.length === 0 ? (
          <div className="col-span-full py-20 sm:py-40 border-2 border-dashed rounded-3xl sm:rounded-[60px] text-center text-gray-300 font-black uppercase tracking-widest">No active bookings found</div>
        ) : (
          bookings.map(b => (
            <div key={b.id} className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[50px] shadow-sm border border-gray-100 space-y-6 group hover:shadow-xl transition-all">
               <div className="flex justify-between gap-4">
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight uppercase break-words">{b.eventType}</h3>
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${b.status === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-700'}`}>{b.status}</span>
               </div>
               <p className="text-3xl md:text-4xl font-black text-gray-900">Rs {Number(b.totalCost || 0).toLocaleString()}</p>
               <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center justify-between pt-6 border-t mt-4">
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{b.date}</p>
                  <button onClick={() => setInvoice(b)} className="px-5 py-2 bg-gray-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all">Invoice</button>
               </div>
            </div>
          ))
        )}
      </div>
      {showModal && <BookingModal user={user} onClose={() => setShowModal(false)} />}
      {invoice && <InvoiceModal booking={invoice} onClose={() => setInvoice(null)} />}
    </div>
  );
}
function AdminDashboard({ bookings, staff }) {
  const stats = useMemo(() => ({
    revenue: bookings.filter(b => b.paymentStatus === 'verified').reduce((s, b) => s + b.totalCost, 0),
    pending: bookings.filter(b => b.paymentStatus === 'pending_verification').length,
    staff: staff.length
  }), [bookings, staff]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Admin Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <StatCard label="Total Profits" value={`₹${stats.revenue.toLocaleString()}`} icon={<TrendingUp className="text-green-500"/>} trend="+12% this month" />
        <StatCard label="Review Queue" value={stats.pending} icon={<ClipboardCheck className="text-yellow-500"/>} trend="Priority Required" />
        <StatCard label="Active Roster" value={stats.staff} icon={<Users className="text-blue-500"/>} trend="Workers Enrolled" />
      </div>
    </div>
  );
}

function AdminBookingManager({ bookings, staffList, attendance }) {
  const [active, setActive] = useState(null);
  const [detail, setDetail] = useState(null);
  const verify = async (id) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bookings', id), { paymentStatus: 'verified', status: 'Approved' });
    } catch (err) { alert(err.message); }
  };
  return (
    <div className="space-y-12">
      <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">All Orders</h2>
      <div className="md:hidden space-y-4">
        {bookings.map(b => (
          <div key={b.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-xl uppercase tracking-tight text-gray-900 break-words">{b.eventType}</p>
                <p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-widest break-words">{b.date} | {b.eventTime || "N/A"} | {b.eventShift || "N/A"}</p>
                <p className="text-xs text-gray-500 mt-1 font-bold break-all">{b.customerEmail} | {b.phone || "No Phone"}</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-black text-[10px] uppercase tracking-widest whitespace-nowrap">{b.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setDetail(b)} className="py-3 bg-gray-100 rounded-xl flex items-center justify-center"><Info size={18}/></button>
              {b.paymentStatus !== 'verified' ? <button onClick={() => verify(b.id)} className="py-3 bg-yellow-500 text-white rounded-xl font-black text-[10px] uppercase">Verify</button> : <div className="py-3 bg-green-50 text-green-600 rounded-xl font-black text-[10px] uppercase text-center">Verified</div>}
              <button onClick={() => setActive(b)} className="py-3 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Users2 size={18}/></button>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block bg-white rounded-3xl md:rounded-[50px] border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[760px]">
          <thead className="bg-gray-50/50 border-b">
            <tr>
              <th className="p-8 text-xs font-black uppercase text-gray-400 tracking-widest">Client & Event</th>
              <th className="p-8 text-xs font-black uppercase text-gray-400 text-center tracking-widest">Status</th>
              <th className="p-8 text-xs font-black uppercase text-gray-400 text-right tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bookings.map(b => (
              <tr key={b.id} className="hover:bg-gray-50/30 transition-all duration-300">
                <td className="p-8"><p className="font-bold text-xl uppercase tracking-tight text-gray-900">{b.eventType}</p><p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-widest">{b.date} | {b.eventTime || "N/A"} | {b.eventShift || "N/A"}</p><p className="text-xs text-gray-500 mt-1 font-bold">{b.customerEmail} | {b.phone || "No Phone"}</p></td>
                <td className="p-8 text-center"><span className="px-4 py-1 bg-yellow-100 text-yellow-700 rounded-full font-black text-[10px] uppercase tracking-widest">{b.status}</span></td>
                <td className="p-8 text-right">
                   <div className="flex justify-end gap-3">
                      <button onClick={() => setDetail(b)} className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200"><Info size={18}/></button>
                      {b.paymentStatus !== 'verified' && <button onClick={() => verify(b.id)} className="bg-yellow-500 text-white px-5 py-2 rounded-2xl font-black text-[10px] uppercase">Verify</button>}
                      <button onClick={() => setActive(b)} className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users2 size={18}/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      {active && <StaffAssignmentModal booking={active} staffList={staffList} attendance={attendance} onClose={() => setActive(null)} />}
      {detail && <BookingDetailModal booking={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function StaffManagement({ staffList, attendance, bookings }) {
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const enroll = async () => {
    if(!name) return;
    try {
      const r = push(dbRef(rtdb, staffPath));
      await set(r, { name, role: 'Helper', defaultRate: HELPER_RATE, isActive: true, createdAt: Date.now() });
      setName('');
    } catch (err) { alert(err.message); }
  };
  return (
    <div className="space-y-12">
       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div><h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Roster</h2><p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Staff Management</p></div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
             <input type="text" placeholder="Worker Name" className="p-4 sm:p-5 bg-white border rounded-3xl font-bold outline-none w-full sm:w-auto" value={name} onChange={e => setName(e.target.value)} />
             <button onClick={enroll} className="px-8 py-4 sm:py-5 bg-gray-900 text-white font-black rounded-3xl uppercase text-xs">Enroll</button>
          </div>
       </div>
       <div className="md:hidden space-y-4">
          {staffList.map(s => {
             const att = attendance.filter(a => a.staffId === s.id);
             const earned = att.reduce((sum, a) => sum + (a.status === 'Present' ? (a.paymentAmount || HELPER_RATE) : 0), 0);
             const pending = att.reduce((sum, a) => sum + (a.status === 'Present' && !a.isPaid ? (a.paymentAmount || HELPER_RATE) : 0), 0);
             return (
               <div key={s.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                 <div className="flex items-start justify-between gap-3">
                   <div className="min-w-0">
                     <p className="font-bold text-xl text-gray-900 break-words">{s.name}</p>
                     <p className="text-[10px] text-gray-400 uppercase font-black">{s.role}</p>
                   </div>
                   <button onClick={() => setSelected({...s, stats: {earned, pending, history: att}})} className="px-4 py-2 rounded-xl border-2 text-yellow-600 font-black text-[10px] uppercase whitespace-nowrap">Details</button>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="p-3 rounded-2xl bg-gray-50 text-center">
                     <p className="text-lg font-black text-gray-900">{att.filter(a => a.status === 'Present').length}</p>
                     <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Events</p>
                   </div>
                   <div className="p-3 rounded-2xl bg-gray-50 text-center">
                     <p className="text-lg font-black text-gray-900">₹{earned.toLocaleString()}</p>
                     <p className="text-[10px] font-black text-red-500 uppercase">₹{pending.toLocaleString()} Due</p>
                   </div>
                 </div>
               </div>
             );
          })}
       </div>
       <div className="hidden md:block bg-white rounded-3xl md:rounded-[50px] shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
             <thead className="bg-gray-50/50 border-b">
                <tr>
                   <th className="p-8 text-[11px] font-black uppercase text-gray-400 tracking-widest">Worker</th>
                   <th className="p-8 text-[11px] font-black uppercase text-gray-400 text-center tracking-widest">Events</th>
                   <th className="p-8 text-[11px] font-black uppercase text-gray-400 text-center tracking-widest">Earnings</th>
                   <th className="p-8 text-[11px] font-black uppercase text-gray-400 text-right tracking-widest">Detail</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
                {staffList.map(s => {
                   const att = attendance.filter(a => a.staffId === s.id);
                   const earned = att.reduce((sum, a) => sum + (a.status === 'Present' ? (a.paymentAmount || HELPER_RATE) : 0), 0);
                   const pending = att.reduce((sum, a) => sum + (a.status === 'Present' && !a.isPaid ? (a.paymentAmount || HELPER_RATE) : 0), 0);
                   return (
                     <tr key={s.id}>
                        <td className="p-8"><p className="font-bold text-2xl text-gray-900">{s.name}</p><p className="text-[10px] text-gray-400 uppercase font-black">{s.role}</p></td>
                        <td className="p-8 text-center font-black">{att.filter(a => a.status === 'Present').length} Events</td>
                        <td className="p-8 text-center"><p className="font-black text-2xl text-gray-900">₹{earned.toLocaleString()}</p><p className="text-[10px] font-black text-red-500 uppercase">₹{pending.toLocaleString()} Due</p></td>
                        <td className="p-8 text-right"><button onClick={() => setSelected({...s, stats: {earned, pending, history: att}})} className="px-6 py-2 rounded-xl border-2 text-yellow-600 font-black text-[10px] uppercase">Details</button></td>
                     </tr>
                   );
                })}
             </tbody>
          </table>
          </div>
       </div>
       {selected && <StaffDetailModal staff={selected} bookings={bookings} onClose={() => setSelected(null)} />}
    </div>
  );
}

