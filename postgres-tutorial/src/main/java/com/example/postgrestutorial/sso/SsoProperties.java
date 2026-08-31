package com.example.postgrestutorial.sso;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * application-sso.yml의 tutorial.sso 값을 Java 객체로 바인딩합니다.
 * 공급자가 바뀌어도 코드를 수정하지 않고 환경변수로 claim과 역할 이름을 바꾸기 위한 설정입니다.
 */
@ConfigurationProperties("tutorial.sso")
public class SsoProperties {

    // true일 때만 SsoSecurityConfig와 SsoController가 활성화됩니다.
    private boolean enabled;

    // ID Token/UserInfo에서 역할을 읽을 경로입니다. 예: roles, groups, realm_access.roles
    private String rolesClaim = "roles";

    // 이 외부 역할을 가진 사용자만 /api/admin/**에 접근할 수 있습니다.
    private String adminRole = "ADMIN";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getRolesClaim() {
        return rolesClaim;
    }

    public void setRolesClaim(String rolesClaim) {
        this.rolesClaim = rolesClaim;
    }

    public String getAdminRole() {
        return adminRole;
    }

    public void setAdminRole(String adminRole) {
        this.adminRole = adminRole;
    }
}
