using System.Collections.Concurrent;
using OrderManagement.Application.Interfaces;

namespace OrderManagement.Infrastructure.BackgroundServices;

public class InMemoryOrderProcessingQueue : IOrderProcessingQueue
{
    private readonly ConcurrentQueue<OrderProcessingMessage> _queue = new();

    public void Enqueue(OrderProcessingMessage message)
    {
        _queue.Enqueue(message);
    }

    public bool TryDequeue(out OrderProcessingMessage? message)
    {
        var result = _queue.TryDequeue(out var msg);
        message = msg;
        return result;
    }
}
