using ECommerce.Models;

namespace ECommerce.Services;

public interface IProductService
{
    Task<List<Product>> GetAllProductsAsync();
    Task<Product?> GetProductByIdAsync(string id);
    Task<Product> CreateProductAsync(Product product);
    Task<Product> UpdateProductAsync(string id, Product product);
    Task<bool> DeleteProductAsync(string id);
    Task<bool> UpdateStockAsync(string id, int quantity);
}

