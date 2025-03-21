import React, { useState, useEffect } from 'react';

const FormRowSelectWithCustom = ({ name, labelText, list, defaultValue = "", onChange, required = false }) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [selectedValue, setSelectedValue] = useState(defaultValue);

  useEffect(() => {
    // If defaultValue is not in list, it's a custom value
    if (defaultValue && !list.includes(defaultValue)) {
      setShowCustomInput(true);
      setCustomValue(defaultValue);
      setSelectedValue("อื่นๆ");
    } else {
      setSelectedValue(defaultValue);
      setShowCustomInput(false);
      setCustomValue("");
    }
  }, [defaultValue, list]);

  const handleSelectChange = (e) => {
    const value = e.target.value;
    setSelectedValue(value);
    
    if (value === "อื่นๆ") {
      setShowCustomInput(true);
      // Don't call onChange yet, wait for custom input
      setCustomValue("");
    } else {
      setShowCustomInput(false);
      setCustomValue("");
      onChange?.({ target: { name, value } });
    }
  };

  const handleCustomInputChange = (e) => {
    const value = e.target.value;
    setCustomValue(value);
    onChange?.({ target: { name, value } });
  };

  return (
    <div className="form-row">
      <label htmlFor={name} className="form-label">
        {labelText || name}
      </label>
      <select
        name={name}
        id={name}
        className="form-select"
        value={selectedValue}
        onChange={handleSelectChange}
        required={required}
      >
        <option value="">โปรดเลือกความสัมพันธ์กับผู้ป่วย</option>
        {list.map((itemValue) => (
          <option key={itemValue} value={itemValue}>
            {itemValue}
          </option>
        ))}
        <option value="อื่นๆ">อื่นๆ</option>
      </select>
      {showCustomInput && (
        <input
          type="text"
          className="form-input mt-2"
          value={customValue}
          onChange={handleCustomInputChange}
          placeholder="ระบุความสัมพันธ์อื่นๆ"
          required={required}
        />
      )}
    </div>
  );
};

export default FormRowSelectWithCustom; 