export const required = (value, field) => {
  if (!value || String(value).trim() === "") {
    throw new Error(`O campo ${field} é obrigatório.`);
  }
};

export const enumValue = (value, allowed, field) => {
  if (!allowed.includes(value)) {
    throw new Error(`Valor inválido para ${field}.`);
  }
};

export const positiveNumber = (value, field) => {
  if (Number(value) <= 0 || Number.isNaN(Number(value))) {
    throw new Error(`${field} deve ser maior que zero.`);
  }
};
