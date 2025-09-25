// src/components/modals/FormFields.js

import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { ROLES } from '../../utils/constants';

const FormFields = ({
  formData,
  onInputChange,
  clientes,
  userRole
}) => {
  return (
    <>
      {userRole === ROLES.EMBARCADOR ? (
        <TextField
          fullWidth
          label="Cliente"
          name="cliente"
          value={formData.cliente}
          onChange={onInputChange}
          placeholder="Ingrese el nombre del cliente"
          InputLabelProps={{ shrink: true }}
          required
        />
      ) : (
        <FormControl fullWidth required>
          <InputLabel
            id="cliente-label"
            shrink={true}
            sx={{ backgroundColor: 'white', paddingX: '4px' }}
          >
            Cliente
          </InputLabel>
          <Select
            labelId="cliente-label"
            id="cliente"
            name="cliente"
            value={formData.cliente}
            label="Cliente"
            onChange={onInputChange}
            displayEmpty
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 250,
                  minWidth: 250,
                  maxWidth: 400
                }
              }
            }}
          >
            <MenuItem value="">
              <em>Seleccionar cliente</em>
            </MenuItem>
            {clientes.map(cliente => (
              <MenuItem
                key={cliente}
                value={cliente}
                sx={{
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  paddingY: '8px'
                }}
                title={cliente}
              >
                {cliente}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </>
  );
};

export default FormFields;