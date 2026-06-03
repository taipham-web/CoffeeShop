const Order = require("../models/Order");

const startAutoCancelJob = () => {
  // Chạy mỗi 1 phút
  setInterval(async () => {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      // Tìm và cập nhật tất cả đơn hàng đang pending và được tạo cách đây hơn 30 phút
      const result = await Order.updateMany(
        {
          status: "pending",
          createdAt: { $lt: thirtyMinutesAgo }
        },
        {
          $set: { status: "cancelled" }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`[Auto-Cancel] Đã tự động hủy ${result.modifiedCount} đơn hàng chờ xác nhận quá 30 phút.`);
      }
    } catch (error) {
      console.error("[Auto-Cancel] Lỗi khi tự động hủy đơn hàng:", error);
    }
  }, 60 * 1000); // 1 minute
  
  console.log("[Auto-Cancel] Job started. Checking for pending orders > 30mins every minute.");
};

module.exports = { startAutoCancelJob };
