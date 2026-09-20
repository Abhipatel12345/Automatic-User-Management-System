const prisma = require('../prisma');

async function getProducts(req, res) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
}

async function createProduct(req, res) {
  try {
    const { name, description, price } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        price: price ? parseFloat(price) : null
      }
    });
    res.status(201).json({ success: true, data: product, message: 'Product created' });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
}

module.exports = {
  getProducts,
  createProduct
};
