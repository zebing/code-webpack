const path = require('path');

// 将对象key链转为数组
// process.env.key => [process, env, key]
module.exports.getIdentifiers = function(memberExpression) {
  const identifierList = [];
  let object = memberExpression.object;
  identifierList.unshift(memberExpression.property.name);

  // object.key1.key2.ke3...的情况
  // 遍历获取 object.key1
  while (object.type === 'MemberExpression') {
    identifierList.unshift(object.property.name);
    object = object.object;
  }

  identifierList.unshift(object.name);
  return identifierList;
}

// 运行js代码
module.exports.evaluteJavascript = function(str){
  return Function('return (' + str + ')')();
}

module.exports.isGlobalName = function(name, options = {}) {
  return options[name];
}

module.exports.requireResolve = function (url, dirname) {
  // react 包名
  // /User/url 绝对路径
  // ./url 相对路径
  
  let resource = url;
  try {
    resource = require.resolve(resource)
  } catch(err) {
    resource = require.resolve(
      path.resolve(dirname, resource)
    );
  }

  return resource;
}

module.exports.loaderPitchResolve = function(resource, dirname) {
  // !../url loader pitch 路径
  const result = {
    resource,
    isEffectDependency: false,
    loaders: [],
  }

  const pitchReg = /^(!!|-!|!)/gi;
  if (pitchReg.test(resource)) {
    // 处理style loader js文件路径
    // example !./node_modules/style-loader/dist/runtime/styleDomAPI.js
    if (/^!.+?\.js$/gi.test(resource)) {
      result.resource = path.resolve(dirname, resource.replace('!', ''));

      // example !!../node_modules/css-loader/dist/cjs.js??clonedRuleSet-1.use[1]!../node_modules/postcss-loader/dist/cjs.js!../node_modules/sass-loader/dist/cjs.js!./styles1.module.scss
    } else {
      result.isEffectDependency = true;
      const rules = resource.replace(pitchReg, '').split('!');
      result.resource = path.resolve(dirname, rules.pop());

      result.loaders = rules.map((value) => {
        const url = value.split('??');
        const loader = require.resolve(
          path.resolve(dirname, url[0])
        );

        return {
          ident: url[1],
          loader,
          options: undefined
        }
      })
    }
    return result;
  }

  result.resource = module.exports.requireResolve(resource, dirname);

  return result;
}