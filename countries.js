export const countryRules = {
  SN: {
    name: "Sénégal",
    regex: /^7[05678]\d{7}$/, // Numéro sénégalais: commence par 7[05678] + 7 chiffres
    example: "770123456"
  },
  FR: {
    name: "France",
    regex: /^(\+33|0)[67]\d{8}$/, // Commence par 06/07 ou +336/+337 + 8 chiffres
    example: "0612345678"
  },
  US: {
    name: "USA",
    regex: /^(\+1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/, // 10 chiffres, pas de 0/1 en début d'indicatif
    example: "4155551234"
  }
};