using ECommerce.Models;

namespace ECommerce.Services;

public interface IOrderService
{
    Task<Order> CreateOrderFromCartAsync(string userId, string userEmail, string? paymentId = null);
    Task<List<Order>> GetOrdersByUserIdAsync(string userId);
    Task<List<Order>> GetAllOrdersAsync();
    Task<Order?> GetOrderByIdAsync(string id);
    Task<Order> UpdateOrderStatusAsync(string id, string status);
}

