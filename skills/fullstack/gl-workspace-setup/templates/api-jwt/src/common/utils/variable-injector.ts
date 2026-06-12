function variableInjector(
  obj: Record<string, unknown>,
  data: string,
  variableIdentifiers = ['#_#', '{{_}}', '%_%'],
) {
  if (!data) {
    return data;
  }

  let newString = data;
  const keys = Object.keys(obj);

  keys.forEach((key) => {
    const value = obj[key];
    if (value === null || value === undefined || value === '') {
      console.warn(`VariableInjector: Value for key "${key}" is empty`);
      return;
    }

    variableIdentifiers.forEach((identifier) => {
      const [start, end] = identifier.split('_');
      const escapedStart = start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedEnd = end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regEx = new RegExp(
        `${escapedStart}\\s*${key}\\s*${escapedEnd}`,
        'g',
      );
      newString = newString.replace(regEx, String(value));
    });
  });

  return newString;
}

export default variableInjector;
