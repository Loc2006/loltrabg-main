import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Sparkles,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  X,
  Coffee,
  Flame,
  Award,
  ChevronRight,
  ArrowRight,
  Utensils,
} from 'lucide-react';

const FALLBACK_ITEMS = [
  {
    id: 6,
    name: 'Combo Đôi Night Movie (1 Bắp L + 2 Nước + 1 Snack)',
    category: 'combo',
    price: 145000,
    image: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=600',
    description: 'Bộ đôi xem phim hoàn hảo: 1 Bắp lớn 2 vị + 2 Nước lớn 32oz + 1 Snack khoai tây',
    badge: '🔥 BEST SELLER • TIẾT KIỆM 30K',
  },
  {
    id: 5,
    name: 'Combo Đơn Tiêu Chuẩn (1 Bắp L + 1 Nước 32oz)',
    category: 'combo',
    price: 95000,
    image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?q=80&w=600',
    description: '1 Bắp phô mai hoặc bơ caramen ngọt lịm + 1 Nước ngọt có gas tự chọn mát lạnh',
    badge: '✨ PHỔ BIẾN • TIẾT KIỆM 13K',
  },
  {
    id: 1,
    name: 'Bắp Rang Bơ Phô Mai (Size L 85oz)',
    category: 'popcorn',
    price: 69000,
    image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=600',
    description: 'Bắp rang giòn rụm phủ phô mai Cheddar thơm béo bùng nổ hương vị',
    badge: '🧀 VỊ PHÔ MAI',
  },
  {
    id: 2,
    name: 'Bắp Rang Caramen Ngọt (Size L 85oz)',
    category: 'popcorn',
    price: 69000,
    image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?q=80&w=600',
    description: 'Bắp rang bơ áo caramen bóng bẩy ngọt ngào chuẩn rạp chiếu phim',
    badge: '🍯 CARAMEN NGỌT',
  },
  {
    id: 3,
    name: 'Coca-Cola Tươi Mát Lạnh (Ly 32oz)',
    category: 'beverage',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=600',
    description: 'Coca-Cola chính hãng có gas cực sảng khoái với đá tinh khiết',
    badge: '🥤 NƯỚC NGỌT',
  },
  {
    id: 4,
    name: 'Sprite Chanh Tươi Mát (Ly 32oz)',
    category: 'beverage',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?q=80&w=600',
    description: 'Sprite chanh thanh mát giải nhiệt cực đã trong suốt suất chiếu',
    badge: '🍋 NƯỚC CHANH',
  },
  {
    id: 7,
    name: 'Xúc Xích Nướng Phô Mai Đức',
    category: 'hot_food',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=600',
    description: 'Xúc xích bò nướng vàng rộm kẹp phô mai chảy béo ngậy kèm sốt mù tạt',
    badge: '🌭 ĂN VẶT NÓNG',
  },
];

export function ConcessionUpsellModal({
  isOpen,
  ticketTotal = 0,
  selectedSeatsCount = 1,
  onClose,
  onConfirm,
  onSkip,
}) {
  const [items, setItems] = useState([]);
  const [selectedMap, setSelectedMap] = useState({}); // { [itemId]: quantity }
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (isOpen) {
      loadConcessions();
    }
  }, [isOpen]);

  const loadConcessions = async () => {
    setLoading(true);
    try {
      const res = await api.getConcessions();
      if (res.success && res.data && res.data.length > 0) {
        setItems(res.data);
      } else {
        setItems(FALLBACK_ITEMS);
      }
    } catch {
      setItems(FALLBACK_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleUpdateQty = (item, delta) => {
    setSelectedMap((prev) => {
      const current = prev[item.id]?.quantity || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }
      return {
        ...prev,
        [item.id]: {
          ...item,
          quantity: next,
        },
      };
    });
  };

  const selectedList = Object.values(selectedMap);
  const concessionTotal = selectedList.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = ticketTotal + concessionTotal;

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'combo') return item.category === 'combo';
    if (activeTab === 'popcorn') return item.category === 'popcorn';
    if (activeTab === 'beverage') return item.category === 'beverage' || item.category === 'hot_food';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl glass-panel rounded-3xl p-5 sm:p-7 shadow-2xl border border-cinema-600 max-h-[92vh] flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cinema-700/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-cinema-950 flex items-center justify-center font-black shadow-glow-amber">
              🍿
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Thưởng Thức Bắp Nước Cùng Phim!
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-ruby-950 text-ruby-400 border border-ruby-600">
                  <Flame className="w-3 h-3" /> Giảm đến 20%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Các combo bắp rang & nước ngọt siêu tiết kiệm khi đặt mua cùng vé
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-cinema-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 py-3 shrink-0 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Tất cả món' },
            { id: 'combo', label: '🔥 Combo Tiết Kiệm' },
            { id: 'popcorn', label: '🍿 Bắp Rang Bơ' },
            { id: 'beverage', label: '🥤 Nước & Đồ Ăn' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-ruby-600 text-white shadow-glow-red'
                  : 'bg-cinema-900/80 text-slate-300 hover:text-white hover:bg-cinema-800 border border-cinema-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Concession Grid */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 py-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Đang tải danh mục bắp nước ưu đãi...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredItems.map((item) => {
                const qty = selectedMap[item.id]?.quantity || 0;
                const isSelected = qty > 0;
                const isCombo = item.category === 'combo';

                return (
                  <div
                    key={item.id}
                    className={`relative p-3.5 rounded-2xl border transition-all flex gap-3.5 items-center justify-between ${
                      isSelected
                        ? 'bg-amber-950/30 border-amber-500/80 shadow-glow-amber ring-1 ring-amber-500/50'
                        : isCombo
                        ? 'bg-gradient-to-br from-cinema-900/90 to-cinema-950/90 border-gold-500/30 hover:border-gold-500/60'
                        : 'bg-cinema-900/70 border-cinema-700/60 hover:border-cinema-600'
                    }`}
                  >
                    {/* Item Image */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-cinema-700 bg-cinema-800">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=300'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=300';
                        }}
                      />
                      {isCombo && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-ruby-600 text-[8px] font-black text-white uppercase">
                          Combo
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-cinema-800 text-amber-300 border border-amber-400/20 uppercase whitespace-nowrap">
                          {item.badge || (item.category === 'combo' ? 'Combo Tiết Kiệm' : 'Món Lẻ')}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-1" title={item.name}>
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                      <div className="text-xs sm:text-sm font-black text-amber-400 font-mono mt-1">
                        {item.price.toLocaleString('vi-VN')} đ
                      </div>
                    </div>

                    {/* Stepper Control */}
                    <div className="shrink-0 flex items-center gap-1.5 bg-cinema-950/80 p-1 rounded-xl border border-cinema-700">
                      {qty > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item, -1)}
                            className="w-7 h-7 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-white flex items-center justify-center font-bold text-xs transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-mono font-black text-xs text-amber-300">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item, 1)}
                            className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-cinema-950 flex items-center justify-center font-bold text-xs transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item, 1)}
                          className="px-3 py-1.5 rounded-lg bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-glow-red"
                        >
                          <Plus className="w-3.5 h-3.5" /> Thêm
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer / Summary Action Bar */}
        <div className="pt-4 border-t border-cinema-700/80 shrink-0 space-y-3">
          <div className="p-3 rounded-2xl bg-cinema-900/90 border border-cinema-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="space-y-0.5">
              <div className="text-slate-400">
                Vé xem phim ({selectedSeatsCount} ghế):{' '}
                <strong className="text-white font-mono">{ticketTotal.toLocaleString('vi-VN')} đ</strong>
              </div>
              <div className="text-slate-400">
                Bắp nước ({selectedList.reduce((s, i) => s + i.quantity, 0)} món):{' '}
                <strong className="text-amber-400 font-mono">
                  {concessionTotal > 0 ? `+${concessionTotal.toLocaleString('vi-VN')} đ` : '0 đ'}
                </strong>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">
                Tổng thanh toán dự kiến
              </span>
              <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
                {grandTotal.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onSkip}
              className="px-4 py-2.5 rounded-xl bg-cinema-900 hover:bg-cinema-800 text-slate-300 hover:text-white border border-cinema-700 text-xs font-bold transition-colors"
            >
              Bỏ Qua (Chỉ Mua Vé)
            </button>

            <button
              type="button"
              onClick={() => onConfirm(selectedList, concessionTotal)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-cinema-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-glow-amber transition-all"
            >
              <span>{concessionTotal > 0 ? 'Thêm Vào Vé & Thanh Toán' : 'Tiếp Tục Thanh Toán'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
