'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_ref) {
  var t = _ref.types;

  var proxyNodes = {
    MemberExpression: function MemberExpression(path) {
      if (this.disableGetTrap[this.disableGetTrap.length - 1]) return;

      var name = path.node.property.name;
      var callee = path.node.computed ? t.identifier(name) : t.stringLiteral(name);
      path.replaceWith(t.callExpression(t.identifier('globalGetInterceptor'), [path.node.object, callee]));
    },
    AssignmentExpression: function AssignmentExpression(path) {
      if (t.isMemberExpression(path.node.left)) {
        if (this.disableSetTrap[this.disableSetTrap.length - 1]) return;

        var memberExpr = path.node.left;
        var callee = memberExpr.computed ? memberExpr.property : t.stringLiteral(memberExpr.property.name);
        path.replaceWith(t.callExpression(t.identifier('globalSetInterceptor'), [memberExpr.object, callee, path.node.right]));
      }
    },


    NewExpression: {
      enter: function enter(path) {
        if (path.node.callee.name === 'Proxy') {
          this.disableGetTrap.push(true);
          this.disableSetTrap.push(true);
        }
      },
      exit: function exit(path) {
        if (path.node.callee.name === 'Proxy') {
          this.disableGetTrap.pop();
          this.disableSetTrap.pop();
        }
      }
    }
  };

  return {
    visitor: {
      Program: function Program(path) {
        path.traverse(proxyNodes, { disableGetTrap: [], disableSetTrap: [] });

        attachRuntime(path);
      }
    }
  };
};

var fs = require('fs');
var babylon = require('babylon');

function attachRuntime(programPath) {
  // get and parse runtime - i think that there should be better ways to do this...
  // addHelper is internal thing that's why i didn't use it
  var runtimeSourceCode = fs.readFileSync(require.resolve('./runtime')).toString();
  var runtimeAst = babylon.parse(runtimeSourceCode);

  programPath.unshiftContainer('body', runtimeAst.program.body);
}