import argon2 from "argon2";

export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: { isEmail: true },
      },
      password: { type: DataTypes.STRING, allowNull: false },
    },
    {
      hooks: {
        beforeCreate: async user => {
          if (user.password) {
            const hash = await argon2.hash(user.password);
            user.password = hash;
          }
        },
      },
    }
  );

  User.prototype.setPassword = async function (password) {
    const hash = await argon2.hash(password);
    this.password = hash;
  };

  User.prototype.validatePassword = async function (password) {
    return argon2.verify(this.password, password);
  };

  User.associate = models => {
    User.hasMany(models.Order, { foreignKey: "userId", as: "orders" });
  };

  return User;
};
