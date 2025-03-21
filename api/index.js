const fetch = require("node-fetch");

module.exports = async (req, res) => {
  try {
    const walletAddress = req.query.address;

    if (!walletAddress) {
      console.error("❌ 缺少钱包地址");
      return res.status(400).json({ error: "缺少钱包地址" });
    }

    console.log(`📢 查询 Uniswap 交易次数: ${walletAddress}`);

    const GRAPHQL_ENDPOINT = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2";

    // GraphQL 查询
    const query = `
    {
      swaps(where: { to: "${walletAddress}" }) { id }
      mints(where: { to: "${walletAddress}" }) { id }
      burns(where: { to: "${walletAddress}" }) { id }
    }`;

    console.log("📢 发送 GraphQL 查询...");
    
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    console.log("📢 GraphQL 响应状态码:", response.status);

    if (!response.ok) {
      console.error(`❌ Uniswap GraphQL 查询失败: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: "Uniswap 查询失败" });
    }

    const data = await response.json();

    console.log("📢 GraphQL 返回数据:", JSON.stringify(data, null, 2));

    if (!data || !data.data) {
      console.error("❌ Uniswap 数据解析失败", data);
      return res.status(500).json({ error: "查询失败" });
    }

    const swapCount = data.data.swaps.length || 0;
    const mintCount = data.data.mints.length || 0;
    const burnCount = data.data.burns.length || 0;
    const totalTx = swapCount + mintCount + burnCount;

    console.log(`✅ 交易次数: Swap=${swapCount}, Mint=${mintCount}, Burn=${burnCount}, Total=${totalTx}`);

    res.setHeader("Access-Control-Allow-Origin", "*"); // 允许跨域
    res.json({
      address: walletAddress,
      totalTx,
      swapCount,
      mintCount,
      burnCount,
    });

  } catch (error) {
    console.error("🚨 服务器错误: ", error);
    res.status(500).json({ error: "服务器错误" });
  }
};
