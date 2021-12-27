% g_adjust.m  2/17/2012  Parker MacCready
%
% This solves the shallow water equations analytically for the geostrophic
% adjustment problem
%
% X-MOM  du/dt - fv = -g*de/dx
% Y-MOM  dv/dt + fu = 0         [d/dy = 0]
% MASS   de/dt + H*du/dx = 0;

clear

% set parameter values (you can reset as you see fit)
H = 100; % fluid depth (m)
g = 9.8; % gravity (m s-2)
c = sqrt(g*H); % max wave speed (m s-1)
f = 1e-4; % Coriolis frequency (s-1)
a = c/f;    % Rossby radius of deformation (m)
k = 2*pi/(2*pi*a);  % disturbance wavenumber in x
nx = 1000;  % number of points in x direction
ovec = ones(nx,1);
zvec = zeros(nx,1);
x = linspace(-50*a,50*a,nx)';   % column vector

om = sqrt((k*c)^2 + f^2);
cp = om/k;
cg = k*c^2/om;

dx = x(2) - x(1);
dt = 0.5 * dx / cp;

nt = 1200;

% Specify initial conditions
env = exp(-(x.*x)/(5*a*5*a)); % Gaussian envelope
e00 = -1;    % surface height disturbance scale (m)
disp('*******************************************************')
disp('  1 = GFD I Midterm Problem: Sine velocity disturbance')
disp('  2 = Poincare wave packet propagation')
disp('  3 = Rossby Adjustment Problem: Initial step in eta')
disp('  4 = Initial eta bump')
nn = input(' Which case to run? ');
switch nn
    case 1  % geostrophic adjustment
        v0 = (e00*f/(H*k))*sin(k*x) .* env;
        u0 = zvec;
        e0 = zvec;
    case 2    % Poincare wave packet propagation
        v0 = (e00*f/(H*k))*sin(k*x) .* env;
        u0 = (e00*om/(H*k))*cos(k*x) .* env;
        e0 = e00*cos(k*x) .* env;
    case 3
        v0 = zvec;
        u0 = zvec;
        e0 = -e00*sign(x);
    case 4
        v0 = zvec;
        u0 = zvec;
        fac = 1;
        e0 = -fac*e00*exp(-(x.*x)/((a/fac)*(a/fac)));
end

% save fields
t = 0; E = e0; U = u0; V = v0; T = t;

% TIME INTEGRATION
%
% first step is forward Euler
ex = gradient(e0) / dx;
ux = gradient(u0) / dx;
ex(1) = 0; ex(end) = 0;
ux(1) = 0; ux(end) = 0;
u1 = u0 + dt*(f*v0 - g*ex);
v1 = v0 + dt*(-f*u0);
e1 = e0 + dt*(-H*ux);

% save fields
E = [E e1]; U = [U u1]; V = [V v1]; T = [T t];

%
for tt = 1:nt
    t = tt * dt;
    % next step is leapfrog
    ex = gradient(e1) / dx;
    ux = gradient(u1) / dx;
    ex(1) = 0; ex(end) = 0;
    ux(1) = 0; ux(end) = 0;
    u2 = u0 + 2*dt*(f*v1 - g*ex);
    v2 = v0 + 2*dt*(-f*u1);
    e2 = e0 + 2*dt*(-H*ux);
    %
    % save fields
    save_fac = 5;
    if round(tt/save_fac) == tt/save_fac
        E = [E e2]; U = [U u2]; V = [V v2]; T = [T t];
    end
    % update before the next time step
    e0 = e1; e1 = e2;
    u0 = u1; u1 = u2;
    v0 = v1; v1 = v2;
end

close all
figure
fs1 = 12;

subplot(221)
pcolor(x/a,f*T,E')
shading flat
caxis([-1 1]);
colorbar
set(gca,'fontsize',fs1);
xlabel('x/a','fontsize',fs1)
ylabel('f*t','fontsize',fs1)
title('\eta (m)','fontsize',fs1,'fontweight','bold')
if nn == 1 | nn == 2
    % plot lines moving at Cp and Cg
    hold on
    lh1 = plot([0 T(end)*cp]/a,[0 T(end)]*f,'--k');
    lh2 = plot([0 T(end)*cg]/a,[0 T(end)]*f,'-k');
    legend([lh1;lh2],'x/t=Cp','x/t=Cg',0);
end

subplot(222)
pcolor(x/a,f*T,U')
shading flat
caxis([-.25 .25]);
colorbar
set(gca,'fontsize',fs1);
xlabel('x/a','fontsize',fs1)
ylabel('f*t','fontsize',fs1)
title('U (m s^{-1})','fontsize',fs1,'fontweight','bold')

subplot(223)
pcolor(x/a,f*T,V')
shading flat
caxis([-.25 .25]);
colorbar
set(gca,'fontsize',fs1);
xlabel('x/a','fontsize',fs1)
ylabel('f*t','fontsize',fs1)
title('V (m s^{-1})','fontsize',fs1,'fontweight','bold')

subplot(224)
plot(x/a,E(:,[1 end]))
set(gca,'fontsize',fs1);
xlabel('x/a','fontsize',fs1)
title('\eta (m) at Start and Finish','fontsize',fs1,'fontweight','bold')

