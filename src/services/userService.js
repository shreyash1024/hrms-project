const GradeCategory = require('../models/gradeCategoryModel');

exports.isValidManager = async (employeeGrade, managerGrade) => {
    const [empGradeCategory, managerGradeCategory] = await Promise.all([
        GradeCategory.findOne({ category: employeeGrade.category }),
        GradeCategory.findOne({ category: managerGrade.category })
    ]);

    const empWeight = empGradeCategory.weight;
    const managerWeight = managerGradeCategory.weight;

    if ((empWeight === 1 || empWeight === 2) && managerWeight === 3)
        return true;
    else if (empWeight !== 1 && empWeight !== 2 && managerWeight - empWeight === 1)
        return true;

    return false;
}