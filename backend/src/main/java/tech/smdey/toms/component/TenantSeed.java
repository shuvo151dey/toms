package tech.smdey.toms.component;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import tech.smdey.toms.entity.Tenant;
import tech.smdey.toms.repository.TenantRepository;

@Component
public class TenantSeed implements ApplicationRunner {
    @Autowired
    private TenantRepository tenantRepository;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (tenantRepository.count() == 0) {
            // Seed initial tenant data
            Tenant tenant = new Tenant();
            tenant.setTenantId("NSE");
            tenant.setName("National Stock Exchange");
            tenant.setMaxPosition(100);
            tenant.setMaxNotional(1000000.0);
            tenant.setDailyLossLimit(10000.0);
            tenant.setMaxOrderQuantity(10);
            tenantRepository.save(tenant);
        }
    }

}
