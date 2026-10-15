package tutor.chat.basics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * 05장 시작점.
 *
 * <p>@SpringBootApplication 하나가 사실 세 가지 일을 한다.
 * <ol>
 *   <li>@Configuration      — 이 클래스도 Bean 설정 클래스다</li>
 *   <li>@ComponentScan      — 이 패키지(tutor.chat.basics) 아래의 @Component 류를 찾아 Bean 으로 등록</li>
 *   <li>@EnableAutoConfiguration — 클래스패스를 보고 "웹 서버가 필요하겠군" 같은 기본 Bean 을 자동 등록</li>
 * </ol>
 * 그래서 이 클래스는 반드시 "가장 바깥 패키지"에 둔다. 아래 패키지만 스캔되기 때문이다.
 */
@SpringBootApplication
@ConfigurationPropertiesScan // @ConfigurationProperties 레코드(CrmProperties)를 찾아 Bean 으로 등록
public class SpringBasicsApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringBasicsApplication.class, args);
    }
}
