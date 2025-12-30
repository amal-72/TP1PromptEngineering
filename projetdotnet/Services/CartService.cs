using ECommerce.Models;
using MongoDB.Driver;

namespace ECommerce.Services;

public class CartService : ICartService
{
    private readonly MongoDBService _mongoService;
    private readonly IMongoCollection<Cart> _cartsCollection;
    private readonly IProductService _productService;

    public CartService(MongoDBService mongoService, IProductService productService)
    {
        _mongoService = mongoService;
        _cartsCollection = mongoService.GetCollection<Cart>("Carts");
        _productService = productService;
    }

    public async Task<Cart?> GetCartByUserIdAsync(string userId)
    {
        return await _cartsCollection.Find(c => c.UserId == userId).FirstOrDefaultAsync();
    }

    public async Task<Cart> AddItemToCartAsync(string userId, string productId, int quantity)
    {
        var product = await _productService.GetProductByIdAsync(productId);
        if (product == null || product.Stock < quantity)
        {
            throw new Exception("Produit non disponible ou stock insuffisant");
        }

        var cart = await GetCartByUserIdAsync(userId);
        if (cart == null)
        {
            cart = new Cart { UserId = userId };
            await _cartsCollection.InsertOneAsync(cart);
        }

        var existingItem = cart.Items.FirstOrDefault(i => i.ProductId == productId);
        if (existingItem != null)
        {
            existingItem.Quantity += quantity;
        }
        else
        {
            cart.Items.Add(new CartItem
            {
                ProductId = productId,
                ProductName = product.Name,
                Price = product.Price,
                Quantity = quantity
            });
        }

        cart.UpdatedAt = DateTime.UtcNow;
        var filter = Builders<Cart>.Filter.Eq(c => c.Id, cart.Id);
        await _cartsCollection.ReplaceOneAsync(filter, cart);

        return cart;
    }

    public async Task<Cart> UpdateCartItemAsync(string userId, string productId, int quantity)
    {
        var cart = await GetCartByUserIdAsync(userId);
        if (cart == null)
        {
            throw new Exception("Panier introuvable");
        }

        var item = cart.Items.FirstOrDefault(i => i.ProductId == productId);
        if (item == null)
        {
            throw new Exception("Article introuvable dans le panier");
        }

        var product = await _productService.GetProductByIdAsync(productId);
        if (product == null || product.Stock < quantity)
        {
            throw new Exception("Stock insuffisant");
        }

        item.Quantity = quantity;
        cart.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Cart>.Filter.Eq(c => c.Id, cart.Id);
        await _cartsCollection.ReplaceOneAsync(filter, cart);

        return cart;
    }

    public async Task<Cart> RemoveItemFromCartAsync(string userId, string productId)
    {
        var cart = await GetCartByUserIdAsync(userId);
        if (cart == null)
        {
            throw new Exception("Panier introuvable");
        }

        cart.Items.RemoveAll(i => i.ProductId == productId);
        cart.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Cart>.Filter.Eq(c => c.Id, cart.Id);
        await _cartsCollection.ReplaceOneAsync(filter, cart);

        return cart;
    }

    public async Task<bool> ClearCartAsync(string userId)
    {
        var cart = await GetCartByUserIdAsync(userId);
        if (cart == null)
        {
            return false;
        }

        cart.Items.Clear();
        cart.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Cart>.Filter.Eq(c => c.Id, cart.Id);
        await _cartsCollection.ReplaceOneAsync(filter, cart);

        return true;
    }
}

