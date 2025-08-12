// 斐波那契数计算Worker
self.onmessage = function(event) {
  const n = event.data;

  // 计算斐波那契数
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }

  const result = fibonacci(n);

  // 发送结果回主线程
  self.postMessage(result);
};
