using Microsoft.AspNetCore.Mvc;
using ECommerce.Models;
using ECommerce.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace ECommerce.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly IOrderService _orderService;

    public AdminController(IProductService productService, IOrderService orderService)
    {
        _productService = productService;
        _orderService = orderService;
    }

    // Gestion des produits
    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] Product product)
    {
        try
        {
            var createdProduct = await _productService.CreateProductAsync(product);
            return Ok(createdProduct);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("products/{id}")]
    public async Task<IActionResult> UpdateProduct(string id, [FromBody] Product product)
    {
        try
        {
            product.Id = id;
            var updatedProduct = await _productService.UpdateProductAsync(id, product);
            return Ok(updatedProduct);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(string id)
    {
        try
        {
            var result = await _productService.DeleteProductAsync(id);
            if (!result)
            {
                return NotFound(new { message = "Produit introuvable" });
            }
            return Ok(new { message = "Produit supprimé" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // Gestion des commandes
    [HttpGet("orders")]
    public async Task<IActionResult> GetAllOrders()
    {
        try
        {
            var orders = await _orderService.GetAllOrdersAsync();
            return Ok(orders);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("orders/{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(string id, [FromBody] UpdateOrderStatusRequest request)
    {
        try
        {
            var order = await _orderService.UpdateOrderStatusAsync(id, request.Status);
            return Ok(order);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

