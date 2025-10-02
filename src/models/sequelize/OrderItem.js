export default (sequelize, DataTypes) => {
  const OrderItem = sequelize.define("OrderItem", {
    sku: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  });

  OrderItem.associate = models => {
    OrderItem.belongsTo(models.Order, { foreignKey: "orderId", as: "order" });
  };

  return OrderItem;
};
