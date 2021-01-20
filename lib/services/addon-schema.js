const joi = require('joi');
const { nameType } = require('../routes/admin-api/util');

const addonDefinitonSchema = joi.object().keys({
    name: nameType,
    displayName: joi.string(),
    description: joi.string().allow(''),
    parameters: joi
        .array()
        .optional()
        .items(
            joi.object().keys({
                name: joi.string().required(),
                displayName: joi.string().required(),
                type: joi.string().required(),
                description: joi.string(),
            }),
        ),
    events: joi
        .array()
        .optional()
        .items(joi.string()),
});

const addonSchema = joi
    .object()
    .keys({
        provider: nameType,
        enabled: joi.bool().default(true),
        description: joi
            .string()
            .allow(null)
            .allow('')
            .optional(),
        parameters: joi
            .object()
            .pattern(joi.string(), [joi.string(), joi.number(), joi.boolean()])
            .optional(),
        events: joi
            .array()
            .optional()
            .items(joi.string()),
    })

    .options({ allowUnknown: false, stripUnknown: true });

module.exports = {
    addonSchema,
    addonDefinitonSchema,
};
