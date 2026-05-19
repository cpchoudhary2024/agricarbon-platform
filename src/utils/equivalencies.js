/**
 * Calculate climate impact equivalencies
 * EPA data: 1 t CO₂e = 16.5 trees/year
 * Average car: 4.6 t CO₂e/year
 */

export const calculateEquivalencies = (co2eTotal) => {
  return {
    // 1 mature tree absorbs ~16.5 kg CO₂/year, or ~0.0165 t CO₂/year
    // So 1 t CO₂e = 1 / 0.0165 ≈ 16.5 trees-years
    treesEquivalent: Math.round(co2eTotal * 16.5),
    
    // Average passenger vehicle: 4.6 t CO₂e/year
    // years = total CO₂e / 4.6
    carsEquivalent: Math.round((co2eTotal / 4.6) * 10) / 10,
    
    // Energy equivalent (1 kWh = ~0.4 kg CO₂e)
    kwhEquivalent: Math.round((co2eTotal * 1000) / 0.4),
    
    // Gasoline equivalent (1 gallon gasoline = ~8.9 kg CO₂e)
    gallonsGasolineEquivalent: Math.round((co2eTotal * 1000) / 8.9),
    
    // Flight equivalent (1 hour transcontinental flight per person = ~0.09 t CO₂e)
    flightHoursEquivalent: Math.round((co2eTotal / 0.09) * 10) / 10,
    
    // Home energy (US household avg = 10.5 t CO₂e/year)
    homeYearsEquivalent: Math.round((co2eTotal / 10.5) * 10) / 10
  };
};

/**
 * Format equivalencies as human-readable strings
 */
export const formatEquivalencies = (equivalencies) => {
  return {
    trees: `equivalent to planting ${equivalencies.treesEquivalent.toLocaleString()} trees for one year`,
    cars: `equivalent to taking a car off the road for ${equivalencies.carsEquivalent.toLocaleString()} years`,
    energy: `equivalent to ${equivalencies.kwhEquivalent.toLocaleString()} kWh of electricity`,
    gasoline: `equivalent to ${equivalencies.gallonsGasolineEquivalent.toLocaleString()} gallons of gasoline not burned`,
    flight: `equivalent to ${equivalencies.flightHoursEquivalent.toLocaleString()} hours of transcontinental flights avoided`,
    home: `equivalent to ${equivalencies.homeYearsEquivalent.toLocaleString()} years of average US household energy use`
  };
};
