using ECommerce.Models;
using BCrypt.Net;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;

namespace ECommerce.Services;

public class UserService : IUserService
{
    private readonly MongoDBService _mongoService;
    private readonly IMongoCollection<User> _usersCollection;

    public UserService(MongoDBService mongoService)
    {
        _mongoService = mongoService;
        _usersCollection = mongoService.GetCollection<User>("Users");
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _usersCollection.Find(u => u.Email == email).FirstOrDefaultAsync();
    }

    public async Task<User> CreateUserAsync(User user)
    {
        user.Password = HashPassword(user.Password);
        await _usersCollection.InsertOneAsync(user);
        return user;
    }

    public bool ValidatePasswordAsync(string password, string hashedPassword)
    {
        return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
    }

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public string GenerateJwtToken(User user, string secretKey, string issuer, string audience, int expirationMinutes)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

