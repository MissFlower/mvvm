/*
 * @Description: 
 * @Version: 0.1.0
 * @Author: AiDongYang
 * @Date: 2020-10-23 14:28:15
 * @LastEditors: AiDongYang
 * @LastEditTime: 2021-01-05 11:43:44
 */
//* 思路：
//* 要实现mvvm的双向绑定，就必须要实现以下几点： 
//* 1、实现一个数据监听器Observer，能够对数据对象的所有属性进行监听，如有变动可拿到最新值并通知订阅者
//* 2、实现一个指令解析器Compile，对每个元素节点的指令进行扫描和解析，根据指令模板替换数据，以及绑定相应的更新函数
//* 3、实现一个Watcher，作为连接Observer和Compile的桥梁，能够订阅并收到每个属性变动的通知，执行指令绑定的相应回调函数，从而更新视图
//* 4、mvvm入口函数，整合以上三者
function Observer(data) {
    this.data = data;
    this.walk(data);
}

Observer.prototype = {
    constructor: Observer,
    walk: function(data) {
        var me = this;
        Object.keys(data).forEach(function(key) {
            me.convert(key, data[key]);
        });
    },
    convert: function(key, val) {
        this.defineReactive(this.data, key, val);
    },

    defineReactive: function(data, key, val) {
        //* 这里是巧妙运用闭包 完成Dep私有化
        //* 我们已经明确订阅者应该是Watcher, 而且var dep = new Dep();
        //* 是在 defineReactive方法内部定义的，所以想通过dep添加订阅者，就必须要在闭包内操作
        var dep = new Dep();
        var childObj = observe(val);
        //* Obeject.defineProperty()来监听属性变动 那么将需要observe的数据对象进行递归遍历，
        //* 包括子属性对象的属性，都加上 setter和getter 这样的话，
        //* 给这个对象的某个值赋值，就会触发setter，那么就能监听到了数据变化。
        //* 接下来我们需要实现一个消息订阅器，很简单，维护一个数组subs，用来收集订阅者，数据变动触发notify，再调用订阅者(Watcher)的update方法
        Object.defineProperty(data, key, {
            enumerable: true, // 可枚举
            configurable: false, // 不能再define
            get: function() {
                //* 由于需要在闭包内添加watcher，所以通过Dep定义一个全局target属性，暂存watcher, 添加完移除
                console.log('observe', val)
                if (Dep.target) {
                    dep.depend();
                }
                return val;
            },
            set: function(newVal) {
                if (newVal === val) {
                    return;
                }
                val = newVal;
                // 新的值是object的话，进行监听
                childObj = observe(newVal);
                // 通知订阅者
                dep.notify();
            }
        });
    }
};

function observe(value, vm) {
    if (!value || typeof value !== 'object') {
        return;
    }

    return new Observer(value);
};


var uid = 0;

function Dep() {
    this.id = uid++;
    this.subs = [];
}

Dep.prototype = {
    addSub: function(sub) {
        this.subs.push(sub);
    },

    depend: function() {
        Dep.target.addDep(this);
    },

    removeSub: function(sub) {
        var index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    },

    notify: function() {
        this.subs.forEach(function(sub) {
            sub.update();
        });
    }
};

Dep.target = null;