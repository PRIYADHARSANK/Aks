export const generateLicensePlate = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let plate = '';
  for (let i = 0; i < 2; i++) {
    plate += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 2; i++) {
    plate += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  for (let i = 0; i < 2; i++) {
    plate += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 1; i++) {
    plate += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return plate;
};

export const getVehicleType = () => {
  const types = ['Car', 'Truck', 'Bus', 'SUV', 'Van'];
  return types[Math.floor(Math.random() * types.length)];
};
