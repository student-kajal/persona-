function buildNetChallanOutPipeline(productIds) {
  return [
    {
      $match: {
        product: { $in: productIds },
        action: { $in: ['CHALLAN_OUT', 'CHALLAN_IN'] }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: '$productInfo' },
    {
      $match: {
        $expr: {
          $gt: ['$timestamp', { $ifNull: ['$productInfo.stockResetAt', new Date(0)] }]
        }
      }
    },
    {
      $group: {
        _id: '$product',
        totalOut: { $sum: { $multiply: ['$quantityChanged', -1] } }
      }
    }
  ];
}

function timestampAfterStockReset(product) {
  const now = Date.now();
  const resetAt = product.stockResetAt?.getTime();
  return new Date(Math.max(now, resetAt === undefined ? now : resetAt + 1));
}

module.exports = { buildNetChallanOutPipeline, timestampAfterStockReset };
