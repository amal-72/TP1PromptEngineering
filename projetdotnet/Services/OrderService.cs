using ECommerce.Models;
using MongoDB.Driver;

namespace ECommerce.Services;

public class OrderService : IOrderService
{
    private readonly MongoDBService _mongoService;
    private readonly IMongoCollection<Order> _ordersCollection;
    private readonly ICartService _cartService;
    private readonly IProductService _productService;

    public OrderService(MongoDBService mongoService, ICartService cartService, IProductService productService)
    {
        _mongoService = mongoService;
        _ordersCollection = mongoService.GetCollection<Order>("Orders");
        _cartService = cartService;
        _productService = productService;
    }

    public async Task<Order> CreateOrderFromCartAsync(string userId, string userEmail, string? paymentId = null)
    {
        var cart = await _cartService.GetCartByUserIdAsync(userId);
        if (cart == null || cart.Items.Count == 0)
        {
            throw new Exception("Le panier est vide");
        }

        // Vérifier le stock et créer les lignes de commande
        var orderItems = new List<OrderItem>();
        foreach (var cartItem in cart.Items)
        {
            var product = await _productService.GetProductByIdAsync(cartItem.ProductId);
            if (product == null || product.Stock < cartItem.Quantity)
            {
                throw new Exception($"Stock insuffisant pour {cartItem.ProductName}");
            }

            orderItems.Add(new OrderItem
            {
                ProductId = cartItem.ProductId,
                ProductName = cartItem.ProductName,
                Price = cartItem.Price,
                Quantity = cartItem.Quantity
            });

            // Réduire le stock
            await _productService.UpdateStockAsync(cartItem.ProductId, -cartItem.Quantity);
        }

        var order = new Order
        {
            UserId = userId,
            UserEmail = userEmail,
            Items = orderItems,
            Status = "En attente",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Persist payment info when available
        if (!string.IsNullOrEmpty(paymentId))
        {
            order.PaymentId = paymentId;
            order.PaymentStatus = "Paid";
        }

        await _ordersCollection.InsertOneAsync(order);

        // Vider le panier
        await _cartService.ClearCartAsync(userId);

        return order;
    }

    public async Task<List<Order>> GetOrdersByUserIdAsync(string userId)
    {
        return await _ordersCollection.Find(o => o.UserId == userId).SortByDescending(o => o.CreatedAt).ToListAsync();
    }

    public async Task<List<Order>> GetAllOrdersAsync()
    {
        return await _ordersCollection.Find(_ => true).SortByDescending(o => o.CreatedAt).ToListAsync();
    }

    public async Task<Order?> GetOrderByIdAsync(string id)
    {
        return await _ordersCollection.Find(o => o.Id == id).FirstOrDefaultAsync();
    }

    public async Task<Order> UpdateOrderStatusAsync(string id, string status)
    {
        var order = await GetOrderByIdAsync(id);
        if (order == null)
        {
            throw new Exception("Commande introuvable");
        }

        order.Status = status;
        order.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Order>.Filter.Eq(o => o.Id, id);
        await _ordersCollection.ReplaceOneAsync(filter, order);

        return order;
    }
}

