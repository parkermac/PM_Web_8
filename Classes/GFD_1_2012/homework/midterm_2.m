% midterm_2.m  2/17/2012  Parker MacCready
%
% this plots the solution for the parcel paths for problem 2 of the
% midterm, which is forced, damped inertial oscilations on an f-plane,
% governed by:
%
% X-MOM du/dt - f*v = -R*u
% Y-MOM dv/dt + f*u = F - R*v
%
% with initial condition u = v = 0 at t = 0

clear
close all
figure

% set parameters
F = 1e-4;                      % forcing (m s-2)
t = linspace(0,5*86400,1000);  % time vector (s)
f = 1e-4;                       % Coriolis parameter (s-1)
Rvec = [0 f/100 f/10 f 10*f];   % vector of possible values for R (s-1)
cvec = ['rbgmck'];                % some colors
% calculate the solution for different values of R/f
for ii = 1:length(Rvec)
    R = Rvec(ii);
    % define some things for convenience
    b = R/f;
    bb = b^2;
    rat = (1/f)/(1 + bb);
    u0 = F*rat;
    G1 = rat*(-b*cos(f*t) + sin(f*t)).*exp(-R*t);
    G2 = rat*(-cos(f*t) - b*sin(f*t)).*exp(-R*t);
    x = u0*(-G1 - b*G2) + u0*t;
    y = u0*(-b*G1 + G2) + b*u0*t;
    % set initial location to the origin
    x = x - x(1);
    y = y - y(1);
    
    lh(ii,1) = plot(x/1000,y/1000,['-',cvec(ii)],'linewidth',1.5);
    hold on
end
axis equal
xlabel('X (km)');
ylabel('Y (km)');
grid on
legend(lh,'R=0','R=f/100','R=f/10','R=f','R=10f',0)