module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2,'always',['feat','fix','chore','docs','style','refactor','test','build','ci']],
    'subject-case': [2,'always','lower-case'],
    'subject-max-length': [2,'always',100],
  },
}
