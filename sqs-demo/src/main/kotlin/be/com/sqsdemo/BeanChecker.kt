package be.com.sqsdemo

import org.springframework.aop.support.AopUtils
import org.springframework.beans.factory.config.BeanPostProcessor
import org.springframework.stereotype.Component

// 프록시가 입혀진 빈들을 시동 시점에 로깅
@Component
class BeanChecker : BeanPostProcessor {
    override fun postProcessAfterInitialization(bean: Any, name: String): Any {
        println("BEAM CLASS : " + bean + " BEAN NAME : " + name)

        if (AopUtils.isAoProxy(bean)) {
            println("[AOP-Proxy] " + name + " -> " + bean.javaClass)
        }
        return bean
    }
}