import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { SeatMap } from '../../components/customer/SeatMap';
import { PaymentModal } from '../../components/customer/PaymentModal';
import { ConcessionUpsellModal } from '../../components/customer/ConcessionUpsellModal';
import { TicketCard } from '../../components/customer/TicketCard';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Film,
  MapPin,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

export function BookingFlowPage({
  scheduleId,
  onBack,
  onNavigateMyTickets,
  onOpenAuth,
  initialIssuedTickets = null,
}) {
  const {
    setSelectedSchedule,
    proceedToHoldSeats,
    cancelHold,
    activeBooking,
    setActiveBooking,
    selectedSeats,
    isHolding,
    resetBookingState,
  } = useBooking();
  const { isAuthenticated } = useAuth();

  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(Boolean(scheduleId) && !initialIssuedTickets);
  const [errorMsg, setErrorMsg] = useState('');
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [issuedTickets, setIssuedTickets] = useState(initialIssuedTickets);

  useEffect(() => {
    if (initialIssuedTickets) {
      setIssuedTickets(initialIssuedTickets);
      setLoading(false);
    }
  }, [initialIssuedTickets]);

  useEffect(() => {
    if (scheduleId && !initialIssuedTickets) {
      fetchSeatMap();
    }
    return () => {
      // Don't auto reset if user is in active hold session
    };
  }, [scheduleId]);

  const fetchSeatMap = async () => {
    try {
      const res = await api.getScheduleSeatMap(scheduleId);
      if (res.success && res.data) {
        setScheduleData(res.data);
        setSelectedSchedule(res.data.schedule);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Không thể tải sơ đồ ghế của suất chiếu.');
    } finally {
      setLoading(false);
    }
  };

  // Tiến hành giữ ghế và hỏi khách có mua thêm bắp nước không
  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập tài khoản để tiếp tục giữ ghế và thanh toán.');
      onOpenAuth();
      return;
    }

    try {
      setErrorMsg('');
      if (!isHolding) {
        await proceedToHoldSeats();
      }
      // Mở modal gợi ý bắp nước & combo trước khi thanh toán
      setIsUpsellOpen(true);
      fetchSeatMap();
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi giữ ghế.');
      fetchSeatMap();
    }
  };

  const handleSkipConcession = () => {
    setIsUpsellOpen(false);
    setIsPaymentOpen(true);
  };

  const handleConfirmConcession = (selectedConcessions, concessionTotal) => {
    if (activeBooking) {
      setActiveBooking((prev) => {
        const ticketAmt = prev.ticketAmount || prev.totalAmount;
        return {
          ...prev,
          concessions: selectedConcessions,
          concessionAmount: concessionTotal,
          ticketAmount: ticketAmt,
          totalAmount: ticketAmt + concessionTotal,
        };
      });
    }
    setIsUpsellOpen(false);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = async (paymentResult) => {
    setIsPaymentOpen(false);
    const finalResult = {
      ...paymentResult,
      concessions: activeBooking?.concessions || [],
      concessionAmount: activeBooking?.concessionAmount || 0,
      totalAmount: activeBooking?.totalAmount || paymentResult.totalAmount,
    };

    if (activeBooking?.concessions && activeBooking.concessions.length > 0) {
      try {
        await api.sellConcessionOrder({
          items: activeBooking.concessions,
          payment_method: paymentResult.paymentMethod || 'momo',
          notes: `Đơn bắp nước mua kèm vé phim ${activeBooking.bookingCode}`,
        });
      } catch (e) {
        console.warn('Lỗi ghi nhận F&B:', e.message);
      }
    }

    setIssuedTickets(finalResult);
    resetBookingState();
  };

  const handleCancelHoldSeats = async () => {
    await cancelHold();
    fetchSeatMap();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="w-12 h-12 border-4 border-ruby-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Đang tải sơ đồ ghế thời gian thực...</p>
      </div>
    );
  }

  // Màn hình hoàn tất đặt vé & Hiển thị vé điện tử
  if (issuedTickets) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-scale-in space-y-6">
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-cinema-900 to-emerald-950 border-2 border-emerald-500/60 text-center shadow-glow-emerald">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2 animate-bounce" />
          <h2 className="text-2xl font-black text-white">THANH TOÁN & ĐẶT VÉ THÀNH CÔNG!</h2>
          <p className="text-xs text-emerald-300 mt-1">
            Đơn hàng #{issuedTickets.bookingCode} đã được xác nhận. Bạn có thể xuất trình mã QR dưới đây khi vào rạp.
          </p>
        </div>

        <div className="space-y-4">
          {issuedTickets.tickets?.map((t) => (
            <TicketCard
              key={t.id}
              ticket={{
                ...t,
                movie_name: issuedTickets.movieName,
                room_name: issuedTickets.roomName,
                start_time: issuedTickets.screeningTime,
                ticket_code: t.ticketCode,
                status: 'active',
              }}
            />
          ))}

          {/* F&B Concession Voucher if purchased */}
          {issuedTickets.concessions && issuedTickets.concessions.length > 0 && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-cinema-900 via-cinema-950 to-cinema-900 border-2 border-amber-500/60 shadow-glow-amber space-y-4 animate-scale-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cinema-700/70">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-cinema-950 flex items-center justify-center font-black text-xl shadow">
                    🍿
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      PHIẾU NHẬN BẮP NƯỚC TẠI QUẦY (F&B VOUCHER)
                    </h3>
                    <p className="text-xs text-amber-300 font-mono">
                      Mã đơn nhận: #{issuedTickets.bookingCode}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-600 text-xs font-bold uppercase whitespace-nowrap">
                  ✓ Đã thanh toán
                </span>
              </div>

              <div className="divide-y divide-cinema-800/80">
                {issuedTickets.concessions.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-white">
                      <span className="w-6 h-6 rounded-lg bg-cinema-800 flex items-center justify-center font-bold text-amber-400 text-xs">
                        {item.quantity}x
                      </span>
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    <span className="font-mono text-amber-300 font-bold">
                      {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
                <span>
                  💡 <b>Hướng dẫn nhận bắp nước:</b> Vui lòng xuất trình mã đơn tại quầy Concession trước giờ chiếu để nhận bắp nước giòn ngon nhất!
                </span>
                <span className="font-mono font-black text-amber-400 shrink-0 ml-2">
                  Tổng F&B: {issuedTickets.concessionAmount?.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-white font-bold text-sm transition-colors"
          >
            ← Tiếp Tục Mua Vé Khác
          </button>
          <button
            onClick={onNavigateMyTickets}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-ruby-600 to-rose-600 text-white font-bold text-sm shadow-glow-red transition-all"
          >
            Xem Tất Cả Vé Của Tôi
          </button>
        </div>
      </div>
    );
  }

  const schedule = scheduleData?.schedule;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in">
      {/* Top Breadcrumb & Movie Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-cinema-700/60">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cinema-900 hover:bg-cinema-800 text-slate-300 hover:text-white border border-cinema-700/60 text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Lịch chiếu
        </button>

        {schedule && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-ruby-400" />
              <span className="font-extrabold text-white text-sm">{schedule.movie_name}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-semibold text-gold-400">
              <MapPin className="w-3.5 h-3.5" />
              {schedule.room_name} ({schedule.room_type?.toUpperCase()})
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Calendar className="w-3.5 h-3.5 text-ruby-400" />
              {new Date(schedule.start_time).toLocaleDateString('vi-VN')}
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Clock className="w-3.5 h-3.5 text-ruby-400" />
              {new Date(schedule.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}

        {/* Refresh Live Seat Map Button */}
        <button
          onClick={fetchSeatMap}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-slate-300 text-xs font-medium border border-cinema-700 transition-colors"
          title="Tải lại trạng thái ghế mới nhất"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới sơ đồ
        </button>
      </div>

      {/* Error Alert (e.g. Concurrency conflict: Ghế vừa được người khác giữ) */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-ruby-950/90 border border-ruby-500 text-ruby-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-glow-red animate-shake">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-ruby-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-ruby-300 hover:text-white font-bold ml-4">
            Đóng
          </button>
        </div>
      )}

      {/* Interactive Seat Map */}
      <SeatMap
        scheduleData={scheduleData}
        onProceedToPayment={handleProceedToPayment}
        onCancelHold={handleCancelHoldSeats}
      />

      {/* Concession & Combo Upsell Modal */}
      <ConcessionUpsellModal
        isOpen={isUpsellOpen}
        ticketTotal={activeBooking?.ticketAmount || activeBooking?.totalAmount || 0}
        selectedSeatsCount={selectedSeats.length || activeBooking?.seats?.length || 1}
        onClose={() => setIsUpsellOpen(false)}
        onSkip={handleSkipConcession}
        onConfirm={handleConfirmConcession}
      />

      {/* Payment Simulator Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
