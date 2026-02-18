namespace OrderManagement.Application.Interfaces;

public record OrderProcessingMessage(int OrderId);

public interface IOrderProcessingQueue
{
    void Enqueue(OrderProcessingMessage message);
    bool TryDequeue(out OrderProcessingMessage? message);
}
