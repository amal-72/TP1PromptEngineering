using Microsoft.AspNetCore.Mvc;
using ECommerce.Models;
using ECommerce.Services;
using System.Security.Claims;

namespace ECommerce.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IConfiguration _configuration;

    public AuthController(IUserService userService, IConfiguration configuration)
    {
        _userService = userService;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var existingUser = await _userService.GetUserByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Cet email est déjà utilisé" });
            }

            var user = new User
            {
                Email = request.Email,
                Name = request.Name,
                Password = request.Password, // Important : assigner le mot de passe avant le hachage
                Role = "Client"
            };

            await _userService.CreateUserAsync(user);
            user.Password = string.Empty; // Ne pas renvoyer le mot de passe

            return Ok(new { message = "Inscription réussie", user });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var user = await _userService.GetUserByEmailAsync(request.Email);
            if (user == null || !_userService.ValidatePasswordAsync(request.Password, user.Password))
            {
                return Unauthorized(new { message = "Email ou mot de passe incorrect" });
            }

            var secretKey = _configuration["Jwt:SecretKey"] ?? "YourSuperSecretKeyForJWTTokenGeneration123456789";
            var issuer = _configuration["Jwt:Issuer"] ?? "ECommerceAPI";
            var audience = _configuration["Jwt:Audience"] ?? "ECommerceClient";
            var expirationMinutes = int.Parse(_configuration["Jwt:ExpirationMinutes"] ?? "60");

            var token = _userService.GenerateJwtToken(user, secretKey, issuer, audience, expirationMinutes);

            return Ok(new
            {
                token,
                user = new
                {
                    id = user.Id,
                    email = user.Email,
                    name = user.Name,
                    role = user.Role
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // Pour simplifier, on récupère l'email depuis le token
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var name = User.FindFirst(ClaimTypes.Name)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            return Ok(new
            {
                id = userId,
                email,
                name,
                role
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

