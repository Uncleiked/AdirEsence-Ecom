import { calculateShippingFee } from "./lib/constants/payment";
const rates = {
  shippingLagos: 50,
  shippingRestOfNigeria: 1000,
  shippingAfrica: 2000,
  shippingInternational: 5000,
};
console.log(calculateShippingFee("NG", "", rates));
