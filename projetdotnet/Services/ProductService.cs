using ECommerce.Models;
using MongoDB.Driver;

namespace ECommerce.Services;

public class ProductService : IProductService
{
    private readonly MongoDBService _mongoService;
    private readonly IMongoCollection<Product> _productsCollection;

    public ProductService(MongoDBService mongoService)
    {
        _mongoService = mongoService;
        _productsCollection = mongoService.GetCollection<Product>("Products");
    }

    public async Task<List<Product>> GetAllProductsAsync()
    {
        return await _productsCollection.Find(_ => true).ToListAsync();
    }

    public async Task<Product?> GetProductByIdAsync(string id)
    {
        return await _productsCollection.Find(p => p.Id == id).FirstOrDefaultAsync();
    }

    public async Task<Product> CreateProductAsync(Product product)
    {
        await _productsCollection.InsertOneAsync(product);
        return product;
    }

    public async Task<Product> UpdateProductAsync(string id, Product product)
    {
        var filter = Builders<Product>.Filter.Eq(p => p.Id, id);
        await _productsCollection.ReplaceOneAsync(filter, product);
        return product;
    }

    public async Task<bool> DeleteProductAsync(string id)
    {
        var result = await _productsCollection.DeleteOneAsync(p => p.Id == id);
        return result.DeletedCount > 0;
    }

    public async Task<bool> UpdateStockAsync(string id, int quantity)
    {
        var filter = Builders<Product>.Filter.Eq(p => p.Id, id);
        var update = Builders<Product>.Update.Inc(p => p.Stock, quantity);
        var result = await _productsCollection.UpdateOneAsync(filter, update);
        return result.ModifiedCount > 0;
    }
}

