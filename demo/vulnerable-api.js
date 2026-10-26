import http from "node:http";
let userBalance = 100;
let processedTransactions = new Set();
const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/withdraw") {
    let body = ""; req.on("data", c => body += c);
    req.on("end", () => {
      const { amount, transactionId } = JSON.parse(body || "{}");
      if (processedTransactions.has(transactionId)) return res.end('{"error":"processed"}');
      if (userBalance >= amount) {
        setTimeout(() => {
          userBalance -= amount; processedTransactions.add(transactionId);
          res.end(JSON.stringify({ success: true, newBalance: userBalance }));
        }, 50);
      } else { res.end('{"error":"insufficient"}'); }
    });
    return;
  }
  res.end('{"error":"not found"}');
});
server.listen(3000);
