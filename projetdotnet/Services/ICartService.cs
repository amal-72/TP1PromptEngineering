using ECommerce.Models;

namespace ECommerce.Services;

public interface ICartService
{
    Task<Cart?> GetCartByUserIdAsync(string userId);
    Task<Cart> AddItemToCartAsync(string userId, string productId, int quantity);
    Task<Cart> UpdateCartItemAsync(string userId, string productId, int quantity);
    Task<Cart> RemoveItemFromCartAsync(string userId, string productId);
    Task<bool> ClearCartAsync(string userId);
}

