/* 违法应用视频清晰度破解
*/

var jclazz = null; //Class类
var jobj = null; //Object类


//获取对象的所在类名，返回字符串
function getObjClassName(obj) {

    if (!jclazz) {
        var jclazz = Java.use("java.lang.Class");
    }
    if (!jobj) {
        var jobj = Java.use("java.lang.Object");
    }
    //jobj.getClass.call(obj)  获取到该对象的Class实例(就是反射的getClass方法，只是该方法是Object的方法)
    //jclazz.getName.call()  对这个Class实例，调用getName()获取类名


    //方法0(无效，因为getClass()方法是继承自父类的?)
    // return obj.getClass().getName();
    // console.log("===========>")
    // console.log("===========>",obj.getClass());
    // return "dddd"

    //方法1
    return jclazz.getName.call(jobj.getClass.call(obj));

    //方法2
    // return obj.$className;
}

//找到实例obj的所在类，并对其mtdName方法的所有重载都进行Hook
function watch(obj, mtdName) {
    //获取该实例的类名
    var listener_name = getObjClassName(obj);
    //根据类名找到该实例的所在类
    var target = Java.use(listener_name);
    //判断是否找到该实例的所在类 || 找到的话继续判断该类是否有对应的属性方法(onClick、onTouch)
    if (!target || !mtdName in target) {
        return;
    }

    // send("[WatchEvent] hooking " + mtdName + ": " + listener_name);

    //对每个重载的方法都实行Hook!!!
    //target[mtdName].overloads指向所有重载方法
    target[mtdName].overloads.forEach(function (overload) {
        //参数用arguments代替！
        overload.implementation = function () {
            //send("[WatchEvent] " + mtdName + ": " + getObjClassName(this));
            console.log("[WatchEvent] " + mtdName + ": " + getObjClassName(this))
            return this[mtdName].apply(this, arguments);
        };
    })
}


/*
如果是以spwan模式对进程进行注入，由于所有的View控件都是在进程启动后才创建的，
因此只需对新增View控件的setOnClickListener()函数进行Hook；

如果是以attach模式进行注入，不仅会对新增View控件进行Hook，
还会使用Java.choose这个API获取进程中所有已存在的View控件。
*/
function OnClickListener() {
    Java.perform(function () {
        /*1.Hook类的方法(android.view.View.setOnClickListener)
        注意：由于是在活动的onCreate()方法里面，所以只在创建活动时执行，所以当只存在一个活动时大概率只会执行一次!!!
        所以想要Hook住就需要spawn模式启动
        */

        //以spawn启动进程的模式来attach的话  (注意：listener是一个实现了接口的匿名类对应的实例)
        Java.use("android.view.View").setOnClickListener.implementation = function (listener) {
            console.log("===>", "创建之前对方法Hook, 根据传进来的参数(实例)去找其所在类，然后对其所有方法Hook", listener == null)

            if (listener != null) {
                watch(listener, 'onClick');
            }
            return this.setOnClickListener(listener);
        };


        /*2.寻找类对应的实例*/
        //如果frida以attach的模式进行attch的话 (主动调用，获取内存中已存在的实例)(注意：instance是一个实现了接口的匿名类对应的实例)
        Java.choose("android.view.View$ListenerInfo", {
            onMatch: function (instance) {
                // console.log("===>", "创建之后去Hook, 得找到对应实例，然后去找实例的所在类，然后对其所有方法Hook!")

                instance = instance.mOnClickListener.value;
                if (instance) {
                    console.log("mOnClickListener name is :" + getObjClassName(instance));
                    watch(instance, 'onClick');
                }
            },
            onComplete: function () {
            }
        })
    })
}

function OnTouchListener() {
    Java.perform(function () {
        /*1.寻找类*/
        //以spawn启动进程的模式来attach的话
        Java.use("android.view.View").setOnTouchListener.implementation = function (listener) {

            if (listener != null) {
                watch(listener, 'onTouch');
            }
            return this.setOnTouchListener(listener);
        };

        /*2.寻找类对应的实例*/
        //如果frida以attach的模式进行attch的话 (主动调用，获取内存中已存在的实例)
        Java.choose("android.view.View$ListenerInfo", {
            onMatch: function (instance) {
                instance = instance.mOnTouchListener;
                if (instance) {
                    console.log("mOnTouchListener name is :" + getObjClassName(instance));
                    watch(instance, 'onTouch');
                }
            },
            onComplete: function () {
            }
        })
    })
}

setImmediate(OnClickListener);
/**
 * OnClickListener#onClick(View v)
 * OnTouchListener#onTouch(View v, MotionEvent event)
 * Activity onTouchEvent(MotionEvent event) Activity 触摸事件
 * RecyclerView OnItemTouchListener#onTouchEvent(RecyclerView recyclerView, MotionEvent motionEvent)  RecyclerView条目触摸事件
 * OnFlingListener#onFling(int x, int y)
 或
 OnScrollChangeListener#onScrollChange(View v, int x,int y, int oldX, int oldY)
 或
 OnScrollListener#onScrollStateChanged(RecyclerView recyclerView, int newState)
 或
 OnScrollListener#onScrolled(RecyclerView recyclerView,int dx, int dy) onScroll RecyclerView 滑动事件
 * ListView OnItemClickListener#onItemClick(AdapterView parent,View view, int position, long id) - onViewItemClick - ListView - 条目点击事件
 * OnScrollListener#onScrollStateChanged(AbsListView view, int scrollState) 或
 OnScrollChangeListener#onScrollChange(View v, int scrollX, int scrollY, int oldScrollX, int oldScrollY)  onScroll ListView 滑动事件
 */