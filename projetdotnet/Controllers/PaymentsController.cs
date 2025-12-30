using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Stripe;

namespace ECommerce.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public PaymentsController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public class PaymentRequest
    {
        public long Amount { get; set; }
    }

    [HttpPost("create-payment-intent")]
    public IActionResult CreatePaymentIntent([FromBody] PaymentRequest request)
    {
        try
        {
            var secretKey = _configuration["Stripe:SecretKey"];
            var publishableKey = _configuration["Stripe:PublishableKey"];
            if (string.IsNullOrEmpty(secretKey))
            {
                return StatusCode(500, new { message = "Stripe SecretKey not configured" });
            }

            StripeConfiguration.ApiKey = secretKey;

            var options = new PaymentIntentCreateOptions
            {
                Amount = request.Amount,
                Currency = "eur",
                PaymentMethodTypes = new List<string> { "card" }
            };

            var service = new PaymentIntentService();
            var intent = service.Create(options);

            return Ok(new { clientSecret = intent.ClientSecret, publishableKey });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
