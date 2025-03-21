const fetch = require("node-fetch");

module.exports = async (req, res) => {
  const walletAddress = req.query.address;

  if (!walletAddress) {
    return res.status(400).json({ error: "缺少钱包地址" });
  }

  const GRAPHQL_ENDPOINT = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2";

  // GraphQL 查询
  const query = `
  {
    swaps(where: { to: "${walletAddress}" }) { id }
    mints(where: { to: "${walletAddress}" }) { id }
    burns(where: { to: "${walletAddress}" }) { id }
  }`;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    
    if (!data || !data.data) {
      return res.status(500).json({ error: "查询失败" });
    }

    const swapCount = data.data.swaps.length;
    const mintCount = data.data.mints.length;
    const burnCount = data.data.burns.length;
    const totalTx = swapCount + mintCount + burnCount;

    res.setHeader("Access-Control-Allow-Origin", "*"); // 允许跨域
    res.json({
      address: walletAddress,
      totalTx,
      swapCount,
      mintCount,
      burnCount,
    });

  } catch (error) {
    console.error("查询失败", error);
    res.status(500).json({ error: "服务器错误" });
  }
};
