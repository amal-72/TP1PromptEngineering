using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ECommerce.Models;

public class Order
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("userEmail")]
    public string UserEmail { get; set; } = string.Empty;

    [BsonElement("items")]
    public List<OrderItem> Items { get; set; } = new List<OrderItem>();

    [BsonElement("total")]
    public decimal Total => Items.Sum(item => item.SubTotal);

    [BsonElement("status")]
    public string Status { get; set; } = "En attente"; // "En attente", "En cours", "Livrée", "Annulée"

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("paymentId")]
    public string PaymentId { get; set; } = string.Empty;

    [BsonElement("paymentStatus")]
    public string PaymentStatus { get; set; } = "Pending";
}

