function ConvertTemp() {}

ConvertTemp.prototype.f2c = function (n) {
  return `${n}°F => ${round((n-32)/1.8, 2).toFixed(2)}°C`;
};

ConvertTemp.prototype.c2f = function (n) {
  return `${n}°C => ${round((n*1.8)+32, 2).toFixed(2)}°F`;
};

ConvertTemp.prototype.f2k = function () {
  return `I'm a Korean Pop Sensation, not a scientist!`;
};

ConvertTemp.prototype.k2f = function () {
  return this.f2k();
};

ConvertTemp.prototype.c2k = function () {
  return this.f2k();
};

ConvertTemp.prototype.k2c = function () {
  return this.f2k();
};

function round(value, exp) {
  if (typeof exp === 'undefined' || +exp === 0) {
    return Math.round(value);
  }

  value = +value;
  exp = +exp;

  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
    return NaN;
  }

  // Shift
  value = value.toString().split('e');
  value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

  // Shift back
  value = value.toString().split('e');
  return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
}

module.exports = new ConvertTemp();
