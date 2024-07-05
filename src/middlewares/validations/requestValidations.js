const { Joi, celebrate, Segments } = require('celebrate');
const { formattedCurrentDate } = require('../../services/leaveRequestService');

const validationSchema = {
    registration: celebrate({
        [Segments.BODY]: Joi.object({
            name: Joi.string().required(),
            email: Joi.string().lowercase().trim().email().required(),
            photo: Joi.string(),
            phone: Joi.string().regex(/^(?:(?:\+|0{0,2})91(\s*|[\-])?|[0]?)?([6789]\d{2}([ -]?)\d{3}([ -]?)\d{4})$/).required().messages({ 'any.regex': 'Please provide valid indian phone number!' }),
            dob: Joi.string().required(),
            role: Joi.string().valid('HR', 'employee').required(),
            department: Joi.string().required(),
            grade: Joi.string().invalid('G1', 'G2', 'G3', 'G4').required().messages({ 'any.invalid': 'Can not onboard for given role! Employee can only be promoted to this roles' }),
            designation: Joi.string().required(),
            salary: Joi.number().required(),
            joiningDate: Joi.string().required(),
            address: Joi.string().required(),
            password: Joi.string().min(8).required(),
            passwordConfirm: Joi.string().valid(Joi.ref('password')).required()
        })
    }, { abortEarly: false }),

    login: celebrate({
        [Segments.BODY]: Joi.object({
            email: Joi.string().required().lowercase().trim().email(),
            password: Joi.string().required().min(8)
        })
    }, { abortEarly: false }),

    forgotPassword: celebrate({
        [Segments.BODY]: Joi.object({
            email: Joi.string().required().lowercase().trim().email()
        })
    }, { abortEarly: false }),

    resetPassword: celebrate({
        [Segments.BODY]: Joi.object({
            password: Joi.string().required().min(8),
            passwordConfirm: Joi.string().required().valid(Joi.ref('password'))
        })
    }, { abortEarly: false }),

    updatePassword: celebrate({
        [Segments.BODY]: Joi.object({
            passwordCurrent: Joi.string().required().min(8),
            password: Joi.string().required().min(8),
            passwordConfirm: Joi.string().required().valid(Joi.ref('password'))
        })
    }, { abortEarly: false }),

    updateUser: celebrate({
        [Segments.BODY]: Joi.object({
            photo: Joi.string(),
            phone: Joi.string().regex(/^(?:(?:\+|0{0,2})91(\s*|[\-])?|[0]?)?([6789]\d{2}([ -]?)\d{3}([ -]?)\d{4})$/).messages({ 'any.regex': 'Please provide valid indian phone number!' }),
            salary: Joi.number(),
            address: Joi.string()
        }).required(),
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        })
    }, { abortEarly: false }),

    updateEmpGrade: celebrate({
        [Segments.BODY]: Joi.object({
            email: Joi.string().lowercase().trim().email().required(),
            action: Joi.string().valid('promotion', 'demotion').required(),
            manager: Joi.string().email()
        })
    }, { abortEarly: false }),

    getUser: celebrate({
        [Segments.QUERY]: Joi.object({
            _id: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
            email: Joi.string().email(),
            department: Joi.string(),
            grade: Joi.string(),
            designation: Joi.string(),
            manager: Joi.string().email(),
            sort: Joi.string(),
            fields: Joi.string(),
            page: Joi.string().regex(/^\d+$/),
            limit: Joi.string().regex(/^\d+$/)
        })
    }, { abortEarly: false }),

    deleteUser: celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        })
    }),

    setManager: celebrate({
        [Segments.BODY]: Joi.object({
            employee: Joi.string().lowercase().trim().email().required(),
            manager: Joi.string().lowercase().trim().email().required()
        })
    }, { abortEarly: false }),

    createDepartment: celebrate({
        [Segments.BODY]: Joi.object({
            name: Joi.string().required(),
            description: Joi.string().required()
        })
    }, { abortEarly: false }),

    updateDepartment: celebrate({
        [Segments.BODY]: Joi.object({
            description: Joi.string()
        }),
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        })
    }, { abortEarly: false }),

    getDepartment: celebrate({
        [Segments.QUERY]: Joi.object({
            _id: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
            name: Joi.string(),
            description: Joi.string(),
            sort: Joi.string(),
            fields: Joi.string(),
            page: Joi.string().regex(/^\d+$/),
            limit: Joi.string().regex(/^\d+$/)
        })
    }, { abortEarly: false }),

    deleteDepartment: celebrate({
        [Segments.BODY]: Joi.object({
            department: Joi.string().required()
        })
    }, { abortEarly: false }),

    createGrade: celebrate({
        [Segments.BODY]: Joi.object({
            category: Joi.string().required(),
            description: Joi.string().required()
        })
    }, { abortEarly: false }),

    updateGrade: celebrate({
        [Segments.BODY]: Joi.object({
            description: Joi.string()
        }),
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        })
    }, { abortEarly: false }),

    getGrade: celebrate({
        [Segments.QUERY]: Joi.object({
            _id: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
            grade: Joi.string(),
            category: Joi.string(),
            level: Joi.string().regex(/^\d+$/),
            active: Joi.string().valid('true', 'false'),
            description: Joi.string(),
            sort: Joi.string(),
            fields: Joi.string(),
            page: Joi.string().regex(/^\d+$/),
            limit: Joi.string().regex(/^\d+$/)
        })
    }, { abortEarly: false }),

    deleteGrade: celebrate({
        [Segments.BODY]: Joi.object({
            grade: Joi.string().required()
        })
    }),

    createDesignation: celebrate({
        [Segments.BODY]: Joi.object({
            name: Joi.string().required(),
            department: Joi.string().required(),
            grade: Joi.string().required()
        })
    }, { abortEarly: false }),

    updateDesignation: celebrate({
        [Segments.BODY]: Joi.object({
            name: Joi.string()
        }),
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        })
    }, { abortEarly: false }),

    getDesignation: celebrate({
        [Segments.QUERY]: Joi.object({
            _id: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
            name: Joi.string(),
            department: Joi.string(),
            grade: Joi.string(),
            sort: Joi.string(),
            fields: Joi.string(),
            page: Joi.string().regex(/^\d+$/),
            limit: Joi.string().regex(/^\d+$/)
        })
    }, { abortEarly: false }),

    deleteDesignation: celebrate({
        [Segments.BODY]: Joi.object({
            designation: Joi.string().required()
        })
    }, { abortEarly: false }),

    createLeaveRequest: celebrate({
        [Segments.BODY]: Joi.object({
            leaveType: Joi.string().valid('PL', 'SL', 'CL').required(),
            startDate: Joi.string().required(),
            endDate: Joi.string().required(),
            half: Joi.string().valid('first', 'second').optional(),
            reason: Joi.string().required()
        })
    }, { abortEarly: false }),

    leaveRequestAction: celebrate({
        [Segments.BODY]: Joi.object({
            action: Joi.string().valid('approve', 'reject').required()
        }),
        [Segments.PARAMS]: Joi.object({
            leaveId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        })
    }, { abortEarly: false }),

    getLeaveRequest: celebrate({
        [Segments.PARAMS]: Joi.object({
            user: Joi.string().valid('requester', 'manager')
        }),
        [Segments.QUERY]: Joi.object({
            employee: Joi.string().lowercase().trim().email(),
            manager: Joi.string().lowercase().trim().email(),
            action: Joi.string().valid('approved', 'rejected'),
            isExpired: Joi.boolean().valid('true', 'false'),
            sort: Joi.string(),
            fields: Joi.string(),
            page: Joi.string().regex(/^\d+$/),
            limit: Joi.string().regex(/^\d+$/)
        })
    }, { abortEarly: false }),

    deleteLeaveRequest: celebrate({
        [Segments.PARAMS]: Joi.object({
            leaveId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        })
    }, { abortEarly: false })
}

module.exports = validationSchema;

/*

celebrate({
        [Segments.BODY]: 
    }, { abortEarly: false })

*/