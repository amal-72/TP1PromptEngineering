using ECommerce.Models;

namespace ECommerce.Services;

public interface IUserService
{
    Task<User?> GetUserByEmailAsync(string email);
    Task<User> CreateUserAsync(User user);
    bool ValidatePasswordAsync(string password, string hashedPassword);
    string HashPassword(string password);
    string GenerateJwtToken(User user, string secretKey, string issuer, string audience, int expirationMinutes);
}

